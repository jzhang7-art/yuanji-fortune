import { useCallback, useEffect, useState } from 'react'
import { clearInvite, readInvite, writeInvite, type InviteState } from './store'

const EVT = 'zmf:invite-change'

function emit() {
  window.dispatchEvent(new Event(EVT))
}

export interface UseInviteResult {
  unlocked: boolean
  code: string | null
  redeem: (raw: string) => Promise<boolean>
  reset: () => void
}

interface RedeemResponse {
  ok: boolean
  code?: string
  token?: string
  redeemedAt?: number
}

/**
 * 邀请码本地状态 hook。
 * - unlocked：是否已兑换有效码
 * - redeem(raw)：POST /api/redeem 做服务端 HMAC 校验，通过则写入并返回 true
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

  const redeem = useCallback(async (raw: string): Promise<boolean> => {
    if (!raw?.trim()) return false
    let data: RedeemResponse
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: raw }),
      })
      data = (await res.json()) as RedeemResponse
    } catch {
      return false
    }
    if (!data?.ok || !data.code || !data.token) return false
    const next: InviteState = {
      code: data.code,
      token: data.token,
      redeemedAt: data.redeemedAt ?? Date.now(),
    }
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
