// POST /api/redeem  { code: string }
// → 200 { ok: true, code, token, redeemedAt }
// → 200 { ok: false }（不区分原因，避免帮攻击者枚举）
//
// 安全模型：
//  - INVITE_SECRET 仅存在于 Vercel 环境变量，不进 bundle
//  - 校验失败统一返回 { ok: false }，不暴露具体 reason
//  - 简易内存节流（per-IP 滑动窗口），抗暴力枚举
import { verify } from './_hmac.mjs'

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

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ ok: false }, 405)
  }
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  if (rateLimited(ip)) return json({ ok: false }, 429)

  let body: { code?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ ok: false }, 400)
  }
  const raw = typeof body?.code === 'string' ? body.code : ''
  if (!raw) return json({ ok: false }, 400)

  const secret = process.env.INVITE_SECRET
  const result = verify(raw, secret)
  if (!result.ok) return json({ ok: false }, 200)

  return json(
    {
      ok: true,
      code: result.code,
      token: result.code, // 当前阶段：码自身即凭证（已是签名）；后续可换为带时效的 JWT
      redeemedAt: Date.now(),
    },
    200,
  )
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}
