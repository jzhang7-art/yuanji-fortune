import { describe, expect, it } from 'vitest'
import { computeQiMen, evaluateQiMenForDayMaster } from '@/domain/qimen'

describe('evaluateQiMenForDayMaster 奇门日干用神', () => {
  const chart = computeQiMen(1995, 6, 11, 6) // 张志春例一：阳遁三局

  it('非甲日干：定位日干地盘宫，返回 0–100 质量', () => {
    const r = evaluateQiMenForDayMaster(chart, '戊')
    expect(r.dayMasterPalace).toBeGreaterThanOrEqual(1)
    expect(r.dayMasterPalace).toBeLessThanOrEqual(9)
    expect(r.quality).toBeGreaterThanOrEqual(0)
    expect(r.quality).toBeLessThanOrEqual(100)
    expect(r.note).toBeTruthy()
    // 例一 palaces[3].earthGan === '戊'，戊落 3 宫
    expect(r.dayMasterPalace).toBe(3)
  })

  it('甲日干：走旬首六仪宫 fallback，不抛错且落点有效', () => {
    const r = evaluateQiMenForDayMaster(chart, '甲')
    expect(r.dayMasterPalace).toBeGreaterThanOrEqual(1)
    expect(r.dayMasterPalace).toBeLessThanOrEqual(9)
    expect(r.quality).toBeGreaterThanOrEqual(0)
  })

  it('只读：调用前后 chart 不变', () => {
    const before = JSON.stringify(chart)
    evaluateQiMenForDayMaster(chart, '庚')
    expect(JSON.stringify(chart)).toBe(before)
  })

  it('不同日干同一局：质量可不同（个人化）', () => {
    const a = evaluateQiMenForDayMaster(chart, '戊').quality
    const b = evaluateQiMenForDayMaster(chart, '丙').quality
    expect(typeof a).toBe('number')
    expect(typeof b).toBe('number')
    // 戊落3宫、丙落他宫，落点不同 → 质量大概率不同（至少落宫不同）
    expect(evaluateQiMenForDayMaster(chart, '戊').dayMasterPalace).not.toBe(
      evaluateQiMenForDayMaster(chart, '丙').dayMasterPalace,
    )
  })
})
