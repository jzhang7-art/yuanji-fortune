// 静态邀请码白名单。前期方案：抖音评论区/私信发码，用户兑换后本地解锁。
// 安全性：仅做"门控提示"，反编译可拿到全部码——这是已知 trade-off。
// 升级路径：流量起来后换 HMAC 签名 + 后端核销（每码限次/限期）。
//
// 添加新码：直接追加字符串。建议 6-10 位、字母数字混合、好读、好念。
// 兑换比对：大小写不敏感、忽略空格与中划线。
export const INVITE_CODES: readonly string[] = [
  'LOTUS-A3F2',
  'LOTUS-B5K8',
  'LOTUS-C7M3',
  'LOTUS-D9N4',
  'LOTUS-E2P6',
  'LOTUS-F4Q7',
  'LOTUS-G6R9',
  'LOTUS-H8S2',
  'LOTUS-J3T5',
  'LOTUS-K5V7',
  'LOTUS-L7W9',
  'LOTUS-M9X3',
  'LOTUS-N2Y6',
  'LOTUS-P4Z8',
  'LOTUS-Q6A4',
  'LOTUS-R8B7',
  'LOTUS-S3C5',
  'LOTUS-T5D8',
  'LOTUS-V7E2',
  'LOTUS-W9F6',
]

export function normalizeCode(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase()
}

const NORMALIZED = new Set(INVITE_CODES.map(normalizeCode))

export function isValidCode(raw: string): boolean {
  if (!raw) return false
  return NORMALIZED.has(normalizeCode(raw))
}
