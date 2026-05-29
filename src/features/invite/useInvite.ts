import { useCallback, useEffect, useState } from 'react'
import { isValidCode, normalizeCode } from './codes'
import { clearInvite, readInvite, writeInvite, type InviteState } from './store'

const EVT = 'zmf:invite-change'

function emit() {
  window.dispatchEvent(new Event(EVT))
}

export interface UseInviteResult {
  unlocked: boolean
  code: string | null
  redeem: (raw: string) => boolean
  reset: () => void
}

/**
 * 邀请码本地状态 hook。
 * - unlocked：是否已兑换有效码
 * - redeem(raw)：尝试兑换，校验通过即写入 localStorage 并返回 true
 * - reset()：清除已兑换状态（设置或调试入口用）
 *
 * 跨组件同步：window 自定义事件 + storage 事件双通道。
 */
export function useInvite(): UseInviteResult {
  const [state, setState] = useState<InviteState | null>(() => readInvite())

  useEffect(() => {
    const sync = () => setState(readInvite())
    window.addEventListener(EVT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const redeem = useCallback((raw: string): boolean => {
    if (!isValidCode(raw)) return false
    const next: InviteState = { code: normalizeCode(raw), redeemedAt: Date.now() }
    writeInvite(next)
    setState(next)
    emit()
    return true
  }, [])

  const reset = useCallback(() => {
    clearInvite()
    setState(null)
    emit()
  }, [])

  return { unlocked: !!state, code: state?.code ?? null, redeem, reset }
}
