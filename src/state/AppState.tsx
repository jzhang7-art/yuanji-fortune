import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { BaZiInput } from '@/domain/bazi'
import type { PublishInfo } from '@/types'
import { loadBaZiInput, saveBaZiInput } from '@/storage'

interface AppStateValue {
  baziInput: BaZiInput | null
  setBaziInput: (input: BaZiInput) => void
  publishInfo: PublishInfo | null
  setPublishInfo: (info: PublishInfo) => void
  ready: boolean
}

const AppStateContext = createContext<AppStateValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [baziInput, setBaziInputState] = useState<BaZiInput | null>(null)
  const [publishInfo, setPublishInfo] = useState<PublishInfo | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadBaZiInput().then((saved) => {
      if (saved) setBaziInputState(saved)
      setReady(true)
    })
  }, [])

  const setBaziInput = (input: BaZiInput) => {
    setBaziInputState(input)
    void saveBaZiInput(input)
  }

  return (
    <AppStateContext.Provider
      value={{ baziInput, setBaziInput, publishInfo, setPublishInfo, ready }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState 必须在 AppStateProvider 内使用')
  return ctx
}
