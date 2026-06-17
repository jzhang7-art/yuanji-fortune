// 邀请码本地持久化。与现有 zmf:* 前缀对齐。
// 新结构（HMAC 方案）：服务端校验通过后写入 { code, token, redeemedAt }。
// 旧结构（明文白名单方案）：{ code, redeemedAt } — 读到即视为过期，清空让用户重新兑换。
const KEY = 'zmf:invite'

export interface InviteState {
  code: string
  token: string
  redeemedAt: number
}

export function readInvite(): InviteState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<InviteState>
    if (typeof parsed?.code !== 'string' || typeof parsed?.token !== 'string') {
      localStorage.removeItem(KEY)
      return null
    }
    return parsed as InviteState
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
