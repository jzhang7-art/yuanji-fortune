import { describe, expect, it } from 'vitest'
import { SHI_SHEN_SEMANTICS } from '@/data/shiShenSemantics'
import type { ShiShen } from '@/domain/shishen'

const ALL: ShiShen[] = [
  '比肩', '劫财', '食神', '伤官', '偏财',
  '正财', '七杀', '正官', '偏印', '正印',
]

describe('十神语义表', () => {
  it('十神全覆盖，字段完整', () => {
    for (const ss of ALL) {
      const e = SHI_SHEN_SEMANTICS[ss]
      expect(e).toBeTruthy()
      expect(e.category).toBeTruthy()
      expect(e.semantic).toBeTruthy()
      expect(typeof e.base).toBe('number')
    }
  })

  it('伤官基分最高、劫财为负（自媒体场景排序）', () => {
    expect(SHI_SHEN_SEMANTICS['伤官'].base).toBe(14)
    expect(SHI_SHEN_SEMANTICS['食神'].base).toBe(12)
    expect(SHI_SHEN_SEMANTICS['劫财'].base).toBe(-3)
    expect(SHI_SHEN_SEMANTICS['伤官'].base).toBeGreaterThan(
      SHI_SHEN_SEMANTICS['正财'].base,
    )
  })
})
