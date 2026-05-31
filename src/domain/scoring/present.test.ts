import { describe, expect, it } from 'vitest'
import { buildPresentDivination } from '@/domain/scoring/present'

describe('buildPresentDivination 当下起局', () => {
  const now = new Date('2026-05-18T12:30:00') // 固定时刻 → 确定

  it('结构完整：aimBoostByHour 长 12，toneShift 有限，headline 非空', () => {
    const p = buildPresentDivination(now)
    expect(p.aimBoostByHour).toHaveLength(12)
    expect(Number.isFinite(p.toneShift)).toBe(true)
    expect(Math.abs(p.toneShift)).toBeLessThanOrEqual(10)
    expect(p.headline).toBeTruthy()
    expect(p.toneScore).toBeGreaterThanOrEqual(0)
    expect(p.toneScore).toBeLessThanOrEqual(100)
  })

  it('确定性：同一 now 两次构建结果一致', () => {
    const a = buildPresentDivination(now)
    const b = buildPresentDivination(now)
    expect(a.aimBoostByHour).toEqual(b.aimBoostByHour)
    expect(a.toneShift).toBe(b.toneShift)
  })

  it('当下局随时刻而动：不同 now 可得不同 aim 或 tone', () => {
    const a = buildPresentDivination(new Date('2026-05-18T12:30:00'))
    const b = buildPresentDivination(new Date('2026-08-20T03:30:00'))
    const differ =
      JSON.stringify(a.aimBoostByHour) !== JSON.stringify(b.aimBoostByHour) ||
      a.toneScore !== b.toneScore
    expect(differ).toBe(true)
  })
})
