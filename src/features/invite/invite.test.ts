import { afterEach, describe, expect, it } from 'vitest'
import { clearInvite, readInvite, writeInvite, type InviteState } from './store'

afterEach(() => {
  localStorage.clear()
})

describe('invite/store', () => {
  const sample: InviteState = {
    code: 'LOTUSA3F2K7M2X9P4',
    token: 'LOTUSA3F2K7M2X9P4',
    redeemedAt: 1000,
  }

  it('round-trips state via localStorage', () => {
    writeInvite(sample)
    expect(readInvite()).toEqual(sample)
  })

  it('returns null when empty', () => {
    expect(readInvite()).toBeNull()
  })

  it('clearInvite removes record', () => {
    writeInvite(sample)
    clearInvite()
    expect(readInvite()).toBeNull()
  })

  it('tolerates corrupt JSON', () => {
    localStorage.setItem('zmf:invite', '{not json')
    expect(readInvite()).toBeNull()
  })

  it('discards legacy shape lacking token (old whitelist scheme)', () => {
    localStorage.setItem(
      'zmf:invite',
      JSON.stringify({ code: 'LOTUSA3F2', redeemedAt: 1 }),
    )
    expect(readInvite()).toBeNull()
    expect(localStorage.getItem('zmf:invite')).toBeNull()
  })
})
