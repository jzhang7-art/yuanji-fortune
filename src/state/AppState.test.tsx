import { describe, expect, it } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AppStateProvider, useAppState } from './AppState'

const BAZI = { year: 1990, month: 5, day: 15, shiChenIndex: 7, gender: '男' as const }

function wrapper({ children }: { children: ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>
}

describe('AppState', () => {
  it('初始 ready=false，baziInput=null；加载完后 ready=true', async () => {
    const { result } = renderHook(() => useAppState(), { wrapper })
    expect(result.current.ready).toBe(false)
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.baziInput).toBeNull()
  })

  it('setBaziInput 同时写入 state 和 localStorage', async () => {
    const { result } = renderHook(() => useAppState(), { wrapper })
    await waitFor(() => expect(result.current.ready).toBe(true))
    act(() => result.current.setBaziInput(BAZI))
    expect(result.current.baziInput).toEqual(BAZI)
    expect(JSON.parse(localStorage.getItem('zmf:bazi') as string)).toEqual(BAZI)
  })

  it('已有保存的八字时，初始化后自动加载', async () => {
    localStorage.setItem('zmf:bazi', JSON.stringify(BAZI))
    const { result } = renderHook(() => useAppState(), { wrapper })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.baziInput).toEqual(BAZI)
  })

  it('未在 Provider 内调用 useAppState 抛错', () => {
    expect(() => renderHook(() => useAppState())).toThrow('useAppState')
  })
})
