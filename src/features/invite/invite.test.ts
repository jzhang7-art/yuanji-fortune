import { afterEach, describe, expect, it } from 'vitest'
import { INVITE_CODES, isValidCode, normalizeCode } from './codes'
import { clearInvite, readInvite, writeInvite } from './store'

afterEach(() => {
  localStorage.clear()
})

describe('invite/codes', () => {
  it('normalize strips spaces, dashes, lowercase', () => {
    expect(normalizeCode('  lotus-a3f2 ')).toBe('LOTUSA3F2')
    expect(normalizeCode('LOTUSA3F2')).toBe('LOTUSA3F2')
  })

  it('valid code passes (case + dash insensitive)', () => {
    expect(isValidCode(INVITE_CODES[0])).toBe(true)
    expect(isValidCode(INVITE_CODES[0].toLowerCase())).toBe(true)
    expect(isValidCode(INVITE_CODES[0].replace('-', ''))).toBe(true)
  })

  it('invalid code rejected', () => {
    expect(isValidCode('')).toBe(false)
    expect(isValidCode('NOPE-XXXX')).toBe(false)
    expect(isValidCode('LOTUS')).toBe(false)
  })
})

describe('invite/store', () => {
  it('round-trips state via localStorage', () => {
    writeInvite({ code: 'LOTUSA3F2', redeemedAt: 1000 })
    expect(readInvite()).toEqual({ code: 'LOTUSA3F2', redeemedAt: 1000 })
  })

  it('returns null when empty', () => {
    expect(readInvite()).toBeNull()
  })

  it('clearInvite removes record', () => {
    writeInvite({ code: 'LOTUSA3F2', redeemedAt: 1 })
    clearInvite()
    expect(readInvite()).toBeNull()
  })

  it('tolerates corrupt JSON', () => {
    localStorage.setItem('zmf:invite', '{not json')
    expect(readInvite()).toBeNull()
  })
})
