// POST /api/redeem  { code: string }
// → 200 { ok: true, code, token, redeemedAt }
// → 200 { ok: false }（不区分原因，避免帮攻击者枚举）
//
// 安全模型：
//  - INVITE_SECRET 仅存在于 Vercel 环境变量，不进 bundle
//  - 校验失败统一返回 { ok: false }，不暴露具体 reason
//  - per-IP 内存节流，抗暴力枚举
//
// 运行时签名：Vercel @vercel/node 默认 Express 风格 (req, res)，
// 不是 Web 标准 Request/Response。
import { verify } from './_hmac.mjs'

interface VercelReq {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}
interface VercelRes {
  status: (code: number) => VercelRes
  json: (data: unknown) => void
}

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 20
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (arr.length >= MAX_PER_WINDOW) return true
  arr.push(now)
  hits.set(ip, arr)
  return false
}

function headerOf(req: VercelReq, key: string): string {
  const v = req.headers[key]
  if (Array.isArray(v)) return v[0] ?? ''
  return v ?? ''
}

export default function handler(req: VercelReq, res: VercelRes): void {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false })
    return
  }
  const ip =
    headerOf(req, 'x-forwarded-for').split(',')[0]?.trim() ||
    headerOf(req, 'x-real-ip') ||
    'unknown'
  if (rateLimited(ip)) {
    res.status(429).json({ ok: false })
    return
  }

  const body = (req.body ?? {}) as { code?: unknown }
  const raw = typeof body.code === 'string' ? body.code : ''
  if (!raw) {
    res.status(400).json({ ok: false })
    return
  }

  const secret = process.env.INVITE_SECRET
  const result = verify(raw, secret)
  if (!result.ok) {
    res.status(200).json({ ok: false })
    return
  }

  res.status(200).json({
    ok: true,
    code: result.code,
    token: result.code, // 当前阶段：码自身即凭证（已是签名）；后续可换为带时效的 JWT
    redeemedAt: Date.now(),
  })
}
