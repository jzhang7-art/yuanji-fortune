import { describe, it, expect, beforeEach } from 'vitest'
import { getConsent, setConsent } from '@/analytics/consent'

describe('consent state', () => {
  beforeEach(() => localStorage.clear())
  it('defaults to unset', () => {
    expect(getConsent()).toBe('unset')
  })
  it('persists granted', () => {
    setConsent('granted')
    expect(getConsent()).toBe('granted')
  })
  it('persists denied', () => {
    setConsent('denied')
    expect(getConsent()).toBe('denied')
  })
})
