// 类型声明，配 _hmac.mjs 用。Vercel 编译 api/redeem.ts 时通过这个文件解析类型。
export function normalize(raw: string): string
export function sign(prefix: string, secret: string): string
export function verify(
  raw: string,
  secret: string | undefined,
): { ok: true; code: string } | { ok: false; reason: string }
export function randomPrefix(): string
export function generate(secret: string): string
export const CONSTANTS: {
  PREFIX_TAG: string
  PREFIX_LEN: number
  SIG_LEN: number
  TOTAL_LEN: number
}
