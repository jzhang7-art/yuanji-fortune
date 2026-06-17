// 邀请码 HMAC 签名/校验（Node 内置 crypto，无依赖）。
// 服务端 + 生成脚本共用。SECRET 只读自环境变量，永不入 bundle。
//
// 码结构（用户看到）：LOTUS-XXXX-SSSSSSSS  其中 SSSSSSSS = HMAC-SHA256(SECRET, normalizedPrefix) 头 4 字节的 hex
// 归一化（normalize）：去空格、去中划线、转大写  → 17 字符 (LOTUS=5 + XXXX=4 + SIG=8)
import { createHmac, timingSafeEqual } from 'node:crypto'

const PREFIX_TAG = 'LOTUS'
const PREFIX_RAND_LEN = 4 // LOTUS-XXXX 里的 X 数量
const PREFIX_LEN = PREFIX_TAG.length + PREFIX_RAND_LEN // 9
const SIG_LEN = 8 // 4 字节 hex
const TOTAL_LEN = PREFIX_LEN + SIG_LEN // 17

export function normalize(raw) {
  return String(raw || '').replace(/[\s-]/g, '').toUpperCase()
}

export function sign(prefix, secret) {
  const mac = createHmac('sha256', secret).update(prefix).digest()
  return mac.subarray(0, 4).toString('hex').toUpperCase()
}

/**
 * 校验邀请码。
 * @param raw 用户输入
 * @param secret HMAC 密钥（环境变量 INVITE_SECRET）
 * @returns {{ ok: true, code: string } | { ok: false, reason: string }}
 */
export function verify(raw, secret) {
  if (!secret) return { ok: false, reason: 'no_secret' }
  const code = normalize(raw)
  if (code.length !== TOTAL_LEN) return { ok: false, reason: 'length' }
  if (!code.startsWith(PREFIX_TAG)) return { ok: false, reason: 'prefix' }
  const prefix = code.slice(0, PREFIX_LEN)
  const sig = code.slice(PREFIX_LEN)
  if (!/^[A-Z0-9]+$/.test(prefix) || !/^[0-9A-F]+$/.test(sig)) {
    return { ok: false, reason: 'charset' }
  }
  const expected = sign(prefix, secret)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'sig' }
  }
  return { ok: true, code }
}

/**
 * 随机生成一个尚未签名的人类前缀，如 LOTUS-A3F2。
 * 字符集排除易混字符 0/O/1/I。
 */
export function randomPrefix() {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let rand = ''
  for (let i = 0; i < PREFIX_RAND_LEN; i++) {
    rand += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return PREFIX_TAG + rand
}

/**
 * 生成一个完整、人类友好的邀请码，如 LOTUS-A3F2-K7M2X9P4。
 */
export function generate(secret) {
  const prefix = randomPrefix()
  const sig = sign(prefix, secret)
  return `${PREFIX_TAG}-${prefix.slice(PREFIX_TAG.length)}-${sig}`
}

export const CONSTANTS = { PREFIX_TAG, PREFIX_LEN, SIG_LEN, TOTAL_LEN }
