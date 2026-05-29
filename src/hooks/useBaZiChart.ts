import { useMemo } from 'react'
import { useAppState } from '@/state/AppState'
import { computeBaZi, type BaZiChart } from '@/domain/bazi'

/**
 * 从 AppState 读 baziInput → computeBaZi → memo 化结果。
 * 没有八字 / 排盘失败时返回 null（调用方决定降级 UI）。
 */
export function useBaZiChart(): BaZiChart | null {
  const { baziInput } = useAppState()
  return useMemo(() => {
    if (!baziInput) return null
    try {
      return computeBaZi(baziInput)
    } catch {
      return null
    }
  }, [baziInput])
}
