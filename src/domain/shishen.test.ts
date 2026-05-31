import { describe, expect, it } from 'vitest'
import { shiShenOf } from '@/domain/shishen'

describe('shiShenOf 十神判定', () => {
  // 以日主甲（木·阳）为基准，遍历十干，覆盖五类关系 × 阴阳同异
  it('甲日主十神真值表 10 条', () => {
    expect(shiShenOf('甲', '甲')).toBe('比肩') // 同我·同阳
    expect(shiShenOf('甲', '乙')).toBe('劫财') // 同我·异
    expect(shiShenOf('甲', '丙')).toBe('食神') // 我生·同阳
    expect(shiShenOf('甲', '丁')).toBe('伤官') // 我生·异
    expect(shiShenOf('甲', '戊')).toBe('偏财') // 我克·同阳
    expect(shiShenOf('甲', '己')).toBe('正财') // 我克·异
    expect(shiShenOf('甲', '庚')).toBe('七杀') // 克我·同阳
    expect(shiShenOf('甲', '辛')).toBe('正官') // 克我·异
    expect(shiShenOf('甲', '壬')).toBe('偏印') // 生我·同阳
    expect(shiShenOf('甲', '癸')).toBe('正印') // 生我·异
  })

  it('阴日主 同阴阳判定正确（乙见乙=比肩，乙见甲=劫财）', () => {
    expect(shiShenOf('乙', '乙')).toBe('比肩')
    expect(shiShenOf('乙', '甲')).toBe('劫财')
  })
})
