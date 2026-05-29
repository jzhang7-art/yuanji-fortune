import { describe, expect, it } from 'vitest'
import { getSession, setSession, removeSession, hasSession } from './session'

describe('platform/session', () => {
  it('未设置时返回 null / false', () => {
    expect(getSession('nope')).toBeNull()
    expect(hasSession('nope')).toBe(false)
  })

  it('set + get 往返一致', () => {
    setSession('k1', 'v1')
    expect(getSession('k1')).toBe('v1')
    expect(hasSession('k1')).toBe(true)
  })

  it('remove 后 get 回到 null', () => {
    setSession('k2', 'v2')
    removeSession('k2')
    expect(getSession('k2')).toBeNull()
    expect(hasSession('k2')).toBe(false)
  })

  it('空字符串 value 也算 has', () => {
    setSession('k3', '')
    expect(hasSession('k3')).toBe(true)
    expect(getSession('k3')).toBe('')
  })
})
