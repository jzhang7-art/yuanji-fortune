import { describe, it, expect, beforeEach } from 'vitest'
import { setConsent } from '@/analytics/consent'
import { track } from '@/analytics/track'

function posthogKeys(): string[] {
  return Object.keys(localStorage).filter((k) => k.startsWith('ph_') || k.startsWith('__ph_'))
}

describe('track gating', () => {
  beforeEach(() => localStorage.clear())
  it('does not load posthog when consent is unset', async () => {
    await track('bazi_submit')
    expect(posthogKeys()).toEqual([])
  })
  it('does not load posthog when consent is denied', async () => {
    setConsent('denied')
    await track('bazi_submit')
    expect(posthogKeys()).toEqual([])
  })
})
