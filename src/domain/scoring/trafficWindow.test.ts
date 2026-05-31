import { describe, expect, it } from 'vitest'
import { computeBaZi } from '@/domain/bazi'
import { buildPresentDivination } from '@/domain/scoring/present'
import { scoreHourFortune, type DayContext } from '@/domain/scoring/hourFortune'
import { applyTrafficWindow } from '@/domain/scoring/trafficWindow'
import { SHI_CHEN } from '@/data/ganzhi'

const present = buildPresentDivination(new Date('2026-05-18T12:30:00'))
const chart = computeBaZi({ year: 1992, month: 3, day: 20, shiChenIndex: 5, gender: '男' })
const ctx: DayContext = { dayGanZhi: '甲子', dayBaselineScore: 55 }
const fortunes = SHI_CHEN.map((sc) =>
  scoreHourFortune(chart, 2026, 5, 18, sc.index, ctx, present),
)

describe('applyTrafficWindow 流量窗口', () => {
  it('保留命理分，叠加流量字段；score = finalScore', () => {
    const ranked = applyTrafficWindow(fortunes, '抖音')
    expect(ranked).toHaveLength(12)
    for (const r of ranked) {
      expect(r.fortuneScore).toBe(fortunes[r.shiChenIndex].fortuneScore)
      expect(r.finalScore).toBe(r.score)
      expect(r.trafficFactor).toBeGreaterThanOrEqual(0.55)
      expect(r.trafficFactor).toBeLessThanOrEqual(1)
    }
  })

  it('凌晨低流量时辰被降权但 finalScore > 0 且标注 lowTraffic', () => {
    const ranked = applyTrafficWindow(fortunes, '抖音')
    const yin = ranked.find((r) => r.shiChenIndex === 2)! // 寅时 03–05
    expect(yin.trafficFactor).toBeLessThan(1)
    expect(yin.finalScore).toBeGreaterThan(0)
    expect(yin.lowTraffic).toBe(true)
  })

  it('活跃窗口内时辰 factor = 1，流量不改命理相对序', () => {
    const ranked = applyTrafficWindow(fortunes, '抖音')
    // 午(6)/戌(10)/亥(11) 均为活跃时辰 → factor 1
    for (const idx of [6, 10, 11]) {
      expect(ranked.find((r) => r.shiChenIndex === idx)!.trafficFactor).toBe(1)
    }
  })
})
