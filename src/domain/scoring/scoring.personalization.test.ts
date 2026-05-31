import { describe, expect, it } from 'vitest'
import { computeBaZi } from '@/domain/bazi'
import { getVideoType } from '@/data/videoTypes'
import { computeForecast } from '@/domain/scoring'

const video = getVideoType('knowledge')!
const NOW = new Date('2026-05-18T12:30:00')

// 两个日主五行明显不同的命主
const chartGeng = computeBaZi({ year: 1990, month: 5, day: 15, shiChenIndex: 7, gender: '男' }) // 庚金
const chartJia = computeBaZi({ year: 1984, month: 2, day: 10, shiChenIndex: 3, gender: '女' })

const hour = (f: ReturnType<typeof computeForecast>, idx: number) =>
  f.target.hours.find((h) => h.shiChenIndex === idx)!

describe('时辰个人化择时（回归断言）', () => {
  it('T1 不同八字 → 不同时辰排名（验收金标准）', () => {
    const a = computeForecast(chartGeng, video, '2026-05-18', '抖音', NOW)
    const b = computeForecast(chartJia, video, '2026-05-18', '抖音', NOW)
    const seqA = a.bestHours.map((h) => h.shiChenIndex).join(',')
    const seqB = b.bestHours.map((h) => h.shiChenIndex).join(',')
    expect(seqA).not.toBe(seqB)
  })

  it('T3 活跃窗口内：finalScore 相对序 == 纯命理 fortuneScore 相对序', () => {
    const f = computeForecast(chartGeng, video, '2026-05-18', '抖音', NOW)
    // 取均为活跃窗口（factor=1）的时辰：午6/未7/戌10/亥11（抖音 hourScores 均 >=50 实为 60/80/92/95）
    const active = [6, 7, 10, 11].map((i) => hour(f, i))
    for (const h of active) expect(h.trafficFactor).toBe(1)
    const byFinal = [...active].sort((x, y) => y.finalScore - x.finalScore).map((h) => h.shiChenIndex)
    const byFortune = [...active].sort((x, y) => y.fortuneScore - x.fortuneScore).map((h) => h.shiChenIndex)
    expect(byFinal).toEqual(byFortune)
  })

  it('T4 凌晨吉时降权不剔除：寅时仍在列表、finalScore>0、lowTraffic 标注', () => {
    const f = computeForecast(chartGeng, video, '2026-05-18', '抖音', NOW)
    const yin = hour(f, 2)
    expect(yin).toBeTruthy()
    expect(yin.finalScore).toBeGreaterThan(0)
    expect(yin.lowTraffic).toBe(true)
    expect(yin.trafficFactor).toBeLessThan(1)
  })

  it('T6 注入固定 now → forecast 可复现', () => {
    const a = computeForecast(chartGeng, video, '2026-05-18', '抖音', NOW)
    const b = computeForecast(chartGeng, video, '2026-05-18', '抖音', NOW)
    expect(a.bestHours.map((h) => h.finalScore)).toEqual(
      b.bestHours.map((h) => h.finalScore),
    )
  })

  it('T7 不同 now → 当下局不同 → 结果可不同', () => {
    const a = computeForecast(chartGeng, video, '2026-05-18', '抖音', new Date('2026-05-18T12:30:00'))
    const b = computeForecast(chartGeng, video, '2026-05-18', '抖音', new Date('2026-08-20T03:30:00'))
    const differ =
      a.target.overall !== b.target.overall ||
      a.target.hours.map((h) => h.fortuneScore).join(',') !==
        b.target.hours.map((h) => h.fortuneScore).join(',')
    expect(differ).toBe(true)
  })

  it('reasons 含十神解释文案', () => {
    const f = computeForecast(chartGeng, video, '2026-05-18', '抖音', NOW)
    expect(f.target.hours[0].reasons.length).toBeGreaterThan(0)
    expect(f.target.hours[0].reasons.some((r) => /时柱/.test(r))).toBe(true)
  })
})
