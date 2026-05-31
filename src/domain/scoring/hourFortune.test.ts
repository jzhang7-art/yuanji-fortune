import { describe, expect, it } from 'vitest'
import { computeBaZi } from '@/domain/bazi'
import { buildPresentDivination } from '@/domain/scoring/present'
import { scoreHourFortune, type DayContext } from '@/domain/scoring/hourFortune'

const present = buildPresentDivination(new Date('2026-05-18T12:30:00'))
// 注意：scoreHourFortune 不收 video 参（视频契合已折进 ctx.dayBaselineScore），故此处无需 video

// 1990-05-15 庚辰日主 vs 1992-03-20 命主
const chartA = computeBaZi({ year: 1990, month: 5, day: 15, shiChenIndex: 7, gender: '男' })
const chartB = computeBaZi({ year: 1992, month: 3, day: 20, shiChenIndex: 5, gender: '男' })

const ctx: DayContext = { dayGanZhi: '甲子', dayBaselineScore: 55 }

describe('scoreHourFortune 纯命理时辰分', () => {
  it('返回完整结构，fortuneScore 在 0–100', () => {
    const f = scoreHourFortune(chartA, 2026, 5, 18, 6, ctx, present)
    expect(f.shiChenIndex).toBe(6)
    expect(f.hourGanZhi).toHaveLength(2)
    expect(f.shiShen.name).toBeTruthy()
    expect(Array.isArray(f.shenSha)).toBe(true)
    expect(f.qimenDayMaster.quality).toBeGreaterThanOrEqual(0)
    expect(f.fortuneScore).toBeGreaterThanOrEqual(0)
    expect(f.fortuneScore).toBeLessThanOrEqual(100)
    expect(f.reasons.length).toBeGreaterThan(0)
    // 向后兼容字段
    expect(f.qimen).toBeTruthy()
    expect(typeof f.qimenScore).toBe('number')
  })

  it('个人化：两个不同八字同一时辰，十神与分数可不同', () => {
    const fa = scoreHourFortune(chartA, 2026, 5, 18, 6, ctx, present)
    const fb = scoreHourFortune(chartB, 2026, 5, 18, 6, ctx, present)
    // 日主不同 → 同一时干的十神不同
    const differ =
      fa.shiShen.name !== fb.shiShen.name || fa.fortuneScore !== fb.fortuneScore
    expect(differ).toBe(true)
  })
})
