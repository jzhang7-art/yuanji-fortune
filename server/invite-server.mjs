#!/usr/bin/env node
// VPS 独立邀请码校验服务。零运行时依赖（只用 Node 内置 + ../api/_hmac.mjs）。
//
// 部署：
//   1. rsync 把 api/ 和 server/ 一起上传到 VPS（保留相对路径）
//   2. 设环境变量 INVITE_SECRET（与 Vercel 端同一个值）
//   3. pm2 start server/invite-server.mjs --name invite-api
//   4. nginx 反代 /api/ → http://127.0.0.1:3001
//
// 与 Vercel api/redeem.ts 行为一致：
//   - 同 HMAC 签名方案、同归一化逻辑
//   - per-IP 内存节流 20 req / 60s
//   - 失败统一 { ok: false } 不泄露原因
import { createServer } from 'node:http'
import { verify } from '../api/_hmac.mjs'

const PORT = Number(process.env.PORT) || 3001
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 20
const MAX_BODY_BYTES = 1024
const hits = new Map()

function rateLimited(ip) {
  const now = Date.now()
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (arr.length >= MAX_PER_WINDOW) return true
  arr.push(now)
  hits.set(ip, arr)
  return false
}

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    let bytes = 0
    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      bytes += chunk.length
      if (bytes > MAX_BODY_BYTES) {
        reject(new Error('payload_too_large'))
        req.destroy()
        return
      }
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        reject(new Error('invalid_json'))
      }
    })
    req.on('error', reject)
  })
}

function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  return (
    xff ||
    String(req.headers['x-real-ip'] || '') ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

const server = createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/api/redeem') {
    return send(res, 404, { ok: false })
  }
  const ip = clientIp(req)
  if (rateLimited(ip)) return send(res, 429, { ok: false })

  let body
  try {
    body = await readJson(req)
  } catch {
    return send(res, 400, { ok: false })
  }
  const raw = typeof body?.code === 'string' ? body.code : ''
  if (!raw) return send(res, 400, { ok: false })

  const result = verify(raw, process.env.INVITE_SECRET)
  if (!result.ok) return send(res, 200, { ok: false })

  return send(res, 200, {
    ok: true,
    code: result.code,
    token: result.code,
    redeemedAt: Date.now(),
  })
})

function shutdown(signal) {
  console.log(`[invite-api] ${signal} received, closing`)
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

server.listen(PORT, () => {
  if (!process.env.INVITE_SECRET) {
    console.warn('[invite-api] WARNING: INVITE_SECRET not set — all redeem requests will fail')
  }
  console.log(`[invite-api] listening on :${PORT}`)
})
