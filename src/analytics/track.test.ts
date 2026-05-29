import { describe, it, expect, beforeEach } from 'vitest'
import { setConsent } from '@/analytics/consent'
import { track } from '@/analytics/track'

describe('track gating', () => {
  beforeEach(() => localStorage.clear())
  it('does not load posthog when consent is unset', async () => {
    await track('bazi_submit')
    expect(localStorage.getItem('ph_phc')).toBeNull()
  })
  it('does not load posthog when consent is denied', async () => {
    setConsent('denied')
    await track('bazi_submit')
    expect(localStorage.getItem('ph_phc')).toBeNull()
  })
})
