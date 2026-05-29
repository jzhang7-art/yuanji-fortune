const KEY = 'zmf:consent'

export type ConsentState = 'unset' | 'granted' | 'denied'

export function getConsent(): ConsentState {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'granted' || v === 'denied') return v
  } catch {}
  return 'unset'
}

export function setConsent(s: 'granted' | 'denied'): void {
  try {
    localStorage.setItem(KEY, s)
  } catch {}
  window.dispatchEvent(new CustomEvent('zmf:consent-changed', { detail: s }))
}

export function onConsentChange(cb: (s: ConsentState) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent).detail as ConsentState)
  window.addEventListener('zmf:consent-changed', handler)
  return () => window.removeEventListener('zmf:consent-changed', handler)
}
