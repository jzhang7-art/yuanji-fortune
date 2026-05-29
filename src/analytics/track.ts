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

let posthog: any = null

async function ensureLoaded(): Promise<any> {
  if (posthog) return posthog
  if (getConsent() !== 'granted') return null
  const { default: ph } = await import('posthog-js')
  ph.init(import.meta.env.VITE_POSTHOG_KEY ?? '', {
    api_host: 'https://us.i.posthog.com',
    persistence: 'localStorage',
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
  })
  posthog = ph
  return ph
}

export async function track(event: EventName, props?: Record<string, unknown>): Promise<void> {
  if (getConsent() !== 'granted') return
  const ph = await ensureLoaded()
  ph?.capture(event, props)
}

onConsentChange((s) => {
  if (s === 'denied') {
    posthog?.opt_out_capturing?.()
  }
})
