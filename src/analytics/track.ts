/// <reference types="vite/client" />
import { getConsent, onConsentChange } from './consent'

type EventName =
  | 'bazi_submit'
  | 'daily_lookup'
  | 'publish_calc'
  | 'schedule_view'
  | 'calendar_view'
  | 'talent_view'
  | 'share_attempt'
  | 'edit_bazi'
  | 'invite_prompt_shown'
  | 'invite_redeem_attempt'
  | 'invite_redeem_success'

let posthog: any = null

async function ensureLoaded(): Promise<any> {
  if (posthog) return posthog
  if (getConsent() !== 'granted') return null
  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key) {
    if (import.meta.env.DEV) console.warn('[track] VITE_POSTHOG_KEY 未设置 — 事件被丢弃。在 .env.local 中配置后重启 dev server 生效。')
    return null
  }
  const { default: ph } = await import('posthog-js')
  ph.init(key, {
    api_host: 'https://us.i.posthog.com',
    persistence: 'localStorage',
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
  })
  posthog = ph
  // 暴露到 window 方便外部调试 / 真机校验（生产无副作用，已 init 后引用）
  ;(window as any).posthog = ph
  return ph
}

export async function track(event: EventName, props?: Record<string, unknown>): Promise<void> {
  if (getConsent() !== 'granted') return
  const ph = await ensureLoaded()
  if (import.meta.env.DEV && ph) console.debug('[track]', event, props ?? {})
  ph?.capture(event, props)
}

onConsentChange((s) => {
  if (s === 'denied') {
    posthog?.opt_out_capturing?.()
  }
})
