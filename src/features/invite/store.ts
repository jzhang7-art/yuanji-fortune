// 邀请码本地持久化。与现有 zmf:* 前缀对齐。
// 存储结构：仅记录已兑换的码（normalized 大写无中划线）+ 兑换时间戳。
const KEY = 'zmf:invite'

export interface InviteState {
  code: string
  redeemedAt: number
}

export function readInvite(): InviteState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as InviteState
    if (typeof parsed?.code !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function writeInvite(state: InviteState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 隐私模式吞掉 */
  }
}

export function clearInvite(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}
