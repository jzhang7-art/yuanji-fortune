import { describe, expect, it } from 'vitest'
import { computeBaZi } from '@/domain/bazi'
import { computeHuangLi } from '@/domain/huangli'
import { computeQiMen, evaluateQiMen } from '@/domain/qimen'
import { buildDecision, computeForecast } from '@/domain/scoring'
import { getVideoType, VIDEO_TYPES } from '@/data/videoTypes'
import { WU_XING } from '@/domain/wuxing'

describe('八字排盘', () => {
  it('1990-05-15 未时 应得日柱庚辰', () => {
    const chart = computeBaZi({ year: 1990, month: 5, day: 15, shiChenIndex: 7, gender: '男' })
    expect(chart.day.gan + chart.day.zhi).toBe('庚辰')
    expect(chart.year.gan + chart.year.zhi).toBe('庚午')
    expect(chart.dayMasterWuXing).toBe('金')
  })

  it('喜用神与忌神互补且非空', () => {
    const chart = computeBaZi({ year: 1995, month: 8, day: 8, shiChenIndex: 4, gender: '女' })
    expect(chart.favorable.length).toBeGreaterThan(0)
    expect(chart.favorable.length + chart.unfavorable.length).toBe(5)
    expect(chart.favorable.some((e) => chart.unfavorable.includes(e))).toBe(false)
  })

  it('旺衰量化与喜用神判据有效', () => {
    const chart = computeBaZi({ year: 1990, month: 5, day: 15, shiChenIndex: 7, gender: '男' })
    expect(chart.strengthScore).toBeGreaterThanOrEqual(0)
    expect(chart.strengthScore).toBeLessThanOrEqual(100)
    expect(WU_XING.reduce((s, e) => s + chart.wuXingPower[e], 0)).toBeGreaterThan(0)
    expect(chart.favorable).toContain(chart.primaryFavorable)
    expect(chart.dominantShiShen).toBeTruthy()
  })

  it('冬月生调候用火、夏月生调候用水', () => {
    const winter = computeBaZi({ year: 1992, month: 12, day: 20, shiChenIndex: 3, gender: '男' })
    expect(winter.tiaoHou).toBe('火')
    expect(winter.favorable).toContain('火')
    const summer = computeBaZi({ year: 2000, month: 6, day: 21, shiChenIndex: 6, gender: '女' })
    expect(summer.tiaoHou).toBe('水')
    expect(summer.favorable).toContain('水')
  })
})

describe('黄历模块', () => {
  it('返回宜忌且分数在合理区间', () => {
    const hl = computeHuangLi(2026, 5, 18)
    expect(hl.dayGanZhi).toHaveLength(2)
    expect(hl.yi.length + hl.ji.length).toBeGreaterThan(0)
    expect(hl.score).toBeGreaterThanOrEqual(5)
    expect(hl.score).toBeLessThanOrEqual(98)
    expect(['旺', '平', '弱']).toContain(hl.qiChang.level)
  })

  it('择吉判据字段有效（黄道黑道 / 建除）', () => {
    const hl = computeHuangLi(2026, 5, 18)
    expect(['黄道', '黑道']).toContain(hl.tianShenType)
    expect(hl.zhiXing).toHaveLength(1)
    expect('建除满平定执破危成收开闭').toContain(hl.zhiXing)
  })

  it('月破等大凶日被一票否决（score ≤ 22 且气场弱）', () => {
    let found = false
    for (let i = 0; i < 366 && !found; i++) {
      const d = new Date(2026, 0, 1)
      d.setDate(d.getDate() + i)
      const hl = computeHuangLi(d.getFullYear(), d.getMonth() + 1, d.getDate())
      if (hl.fatalSha.length > 0) {
        expect(hl.score).toBeLessThanOrEqual(22)
        expect(hl.qiChang.level).toBe('弱')
        found = true
      }
    }
    expect(found).toBe(true)
  })
})

describe('奇门遁甲排盘', () => {
  it('九宫俱全，局数 1–9', () => {
    const chart = computeQiMen(2026, 5, 18, 6)
    expect(chart.juShu).toBeGreaterThanOrEqual(1)
    expect(chart.juShu).toBeLessThanOrEqual(9)
    for (let p = 1; p <= 9; p++) {
      expect(chart.palaces[p].star).toBeTruthy()
      expect(chart.palaces[p].god).toBeTruthy()
    }
    // 中五宫无门，其余八宫各有门
    expect(chart.palaces[5].door).toBeNull()
  })

  it('八门各落一宫不重复', () => {
    const chart = computeQiMen(2026, 5, 18, 6)
    const doors = [1, 2, 3, 4, 6, 7, 8, 9].map((p) => chart.palaces[p].door)
    expect(new Set(doors).size).toBe(8)
  })

  it('评估返回 0–100 分', () => {
    const res = evaluateQiMen(computeQiMen(2026, 5, 18, 6))
    expect(res.score).toBeGreaterThanOrEqual(0)
    expect(res.score).toBeLessThanOrEqual(100)
    expect(res.highlights).toHaveLength(3)
  })
})

// 用《神奇之门》（张志春）书中两个完整排盘案例校验排盘算法
describe('奇门遁甲 · 张志春案例校验', () => {
  it('例一：1995-06-11 丁巳时 → 阳遁三局，值符天任，值使生门落2宫', () => {
    const chart = computeQiMen(1995, 6, 11, 5) // 巳时
    expect(chart.hourGanZhi).toBe('丁巳')
    expect(chart.dunType).toBe('阳遁')
    expect(chart.juShu).toBe(3)
    expect(chart.zhiFuStar).toBe('天任')
    expect(chart.zhiShiDoor).toBe('生门')
    // 地盘：阳遁三局 戊在3宫、癸在8宫
    expect(chart.palaces[3].earthGan).toBe('戊')
    expect(chart.palaces[8].earthGan).toBe('癸')
    // 值符天任随时干丁落天盘9宫
    expect(chart.palaces[9].star).toBe('天任')
    // 值使生门随时宫落2宫（书中明确）
    expect(chart.palaces[2].door).toBe('生门')
    // 八神：值符落9宫、白虎落1宫
    expect(chart.palaces[9].god).toBe('值符')
    expect(chart.palaces[1].god).toBe('白虎')
  })

  it('例二：1995-08-13 戊戌时 → 阴遁八局，值符天禽，值使死门落1宫', () => {
    const chart = computeQiMen(1995, 8, 13, 10) // 戌时
    expect(chart.hourGanZhi).toBe('戊戌')
    expect(chart.dunType).toBe('阴遁')
    expect(chart.juShu).toBe(8)
    expect(chart.zhiFuStar).toBe('天禽')
    expect(chart.zhiShiDoor).toBe('死门')
    // 地盘：阴遁八局 戊在8宫、辛在5宫
    expect(chart.palaces[8].earthGan).toBe('戊')
    expect(chart.palaces[5].earthGan).toBe('辛')
    // 值使死门随时宫落1宫（书中明确）
    expect(chart.palaces[1].door).toBe('死门')
  })

  // 拆补法定局校验：取自《神奇之门》逐日用局表（1996-02 / 2002-12），
  // 只选未跨节气交界、整日同元的日期（时辰不影响定局）
  it.each([
    // [年, 月, 日, 阴阳遁, 局数, 说明]
    [1996, 2, 1, '阳遁', 3, '大寒上元'],
    [1996, 2, 7, '阳遁', 2, '立春下元'],
    [1996, 2, 12, '阳遁', 8, '立春上元'],
    [1996, 2, 22, '阳遁', 3, '雨水下元'],
    [1996, 2, 27, '阳遁', 9, '雨水上元'],
    [2002, 12, 2, '阴遁', 2, '小雪下元'],
    [2002, 12, 12, '阴遁', 7, '大雪中元'],
    [2002, 12, 17, '阴遁', 1, '大雪下元'],
    [2002, 12, 27, '阳遁', 7, '冬至中元'],
  ] as const)('定局 %i-%i-%i → %s%i局（%s）', (y, m, d, dun, ju, _desc) => {
    const chart = computeQiMen(y, m, d, 6) // 时辰不影响定局，固定取午时
    expect(chart.dunType).toBe(dun)
    expect(chart.juShu).toBe(ju)
  })
})

describe('评分引擎', () => {
  it('生成完整预测', () => {
    const chart = computeBaZi({ year: 1992, month: 3, day: 20, shiChenIndex: 5, gender: '男' })
    const video = getVideoType('knowledge')!
    const forecast = computeForecast(chart, video, '2026-05-18', 'B站')
    expect(forecast.target.overall).toBeGreaterThanOrEqual(0)
    expect(forecast.target.overall).toBeLessThanOrEqual(100)
    expect(forecast.bestHours).toHaveLength(12)
    expect(forecast.futureDays).toHaveLength(7) // B站预测周期一周
    expect(forecast.bestDays[0].score).toBeGreaterThanOrEqual(
      forecast.bestDays[6].score,
    )
  })

  it('预测周期随平台变化', () => {
    const chart = computeBaZi({ year: 1992, month: 3, day: 20, shiChenIndex: 5, gender: '男' })
    const video = getVideoType('knowledge')!
    const dou = computeForecast(chart, video, '2026-05-18', '抖音')
    const xhs = computeForecast(chart, video, '2026-05-18', '小红书')
    const bili = computeForecast(chart, video, '2026-05-18', 'B站')
    expect(dou.futureDays).toHaveLength(1)
    expect(xhs.futureDays).toHaveLength(2)
    expect(bili.futureDays).toHaveLength(7)
  })

  it('平台流量为窗口约束：换平台不改当日总分，且不污染活跃窗口内命理序', () => {
    const chart = computeBaZi({ year: 1992, month: 3, day: 20, shiChenIndex: 5, gender: '男' })
    const video = getVideoType('knowledge')!
    const now = new Date('2026-05-18T12:30:00')
    const dou = computeForecast(chart, video, '2026-05-18', '抖音', now)
    const bili = computeForecast(chart, video, '2026-05-18', 'B站', now)
    // 当日总分只来自命理，与平台无关
    expect(dou.target.overall).toBe(bili.target.overall)
    const hour = (f: typeof dou, idx: number) =>
      f.target.hours.find((h) => h.shiChenIndex === idx)!
    // 凌晨低流量时辰被降权但不剔除（降权不剔除）
    const yin = hour(dou, 2)
    expect(yin.lowTraffic).toBe(true)
    expect(yin.finalScore).toBeGreaterThan(0)
    expect(yin.trafficFactor).toBeLessThan(1)
    // 晚间高峰时辰为活跃窗口，命理全权（factor=1）
    expect(hour(dou, 11).platformPeak).toBe(true)
    expect(hour(dou, 11).trafficFactor).toBe(1)
  })

  it('生成今日决策且与预测一致', () => {
    const chart = computeBaZi({ year: 1992, month: 3, day: 20, shiChenIndex: 5, gender: '男' })
    const video = getVideoType('knowledge')!
    const forecast = computeForecast(chart, video, '2026-05-18', 'B站')
    const decision = buildDecision(forecast)
    expect(['go', 'hold', 'wait']).toContain(decision.verdict)
    expect(decision.bestHour).toBe(forecast.bestHours[0])
    expect(decision.grade.label).toBeTruthy()
    // 决策档位须与目标日总分一致
    if (forecast.target.overall >= 65) expect(decision.verdict).toBe('go')
    else if (forecast.target.overall < 45) expect(decision.verdict).toBe('wait')
    // betterDay 若存在，分数须显著高于目标日
    if (decision.betterDay) {
      expect(decision.betterDay.score).toBeGreaterThanOrEqual(forecast.target.overall + 8)
    }
  })
})

describe('视频类型五行', () => {
  it('每类 elements 为 1–2 个合法五行且不重复', () => {
    expect(VIDEO_TYPES).toHaveLength(15)
    for (const vt of VIDEO_TYPES) {
      expect(vt.elements.length).toBeGreaterThanOrEqual(1)
      expect(vt.elements.length).toBeLessThanOrEqual(2)
      for (const e of vt.elements) {
        expect(WU_XING).toContain(e)
      }
      expect(new Set(vt.elements).size).toBe(vt.elements.length)
    }
  })

  it('订正后的关键类型五行正确', () => {
    const elems = (id: string) => getVideoType(id)!.elements
    expect(elems('fashion')).toEqual(['木', '火'])
    expect(elems('beauty')).toEqual(['火', '水'])
    expect(elems('tech')).toEqual(['金', '水'])
    expect(elems('parenting')).toEqual(['土', '木'])
    expect(elems('travel')).toEqual(['水', '木'])
  })
})
