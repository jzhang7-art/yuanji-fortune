// 评分引擎：合成「爆火概率」，推荐最佳时辰与最佳日期
import type { BaZiChart } from '@/domain/bazi'
import type { HuangLiInfo } from '@/domain/huangli'
import { computeHuangLi } from '@/domain/huangli'
import { sheng } from '@/domain/wuxing'
import { VIDEO_TYPES, type VideoType } from '@/data/videoTypes'
import { GAN_WU_XING, SHI_CHEN, ZHI_WU_XING } from '@/data/ganzhi'
import type { DiZhi, TianGan } from '@/data/ganzhi'
import { getPlatformProfile } from '@/data/scoringConfig'
import { scoreHourFortune, type DayContext } from '@/domain/scoring/hourFortune'
import { applyTrafficWindow, type RankedHour } from '@/domain/scoring/trafficWindow'
import { buildPresentDivination, type PresentDivination } from '@/domain/scoring/present'
import { clamp, fromYmd, toYmd } from '@/util'

export { getQiMen } from '@/domain/scoring/qimenCache'

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export type HourScore = RankedHour

export interface DayScore {
  date: string
  weekday: string
  score: number
  dayGanZhi: string
}

export interface DayDetail {
  date: string
  dayGanZhi: string
  baziDayScore: number
  videoScore: number
  huangli: HuangLiInfo
  hours: RankedHour[]
  qimenAvg: number
  overall: number
}

export interface Forecast {
  target: DayDetail
  bestHours: RankedHour[] // 按分数降序
  futureDays: DayScore[] // 按日期顺序
  bestDays: DayScore[] // 按分数降序
  presentHeadline: string
}

/** 八字喜用神 vs 当日干支五行 */
function baziDayScore(chart: BaZiChart, dayGanZhi: string): number {
  const gan = dayGanZhi.charAt(0) as TianGan
  const zhi = dayGanZhi.charAt(1) as DiZhi
  let s = 50
  for (const e of [GAN_WU_XING[gan], ZHI_WU_XING[zhi]]) {
    if (e === chart.primaryFavorable) s += 16
    else if (chart.favorable.includes(e)) s += 10
    else s -= 12
  }
  return clamp(s, 10, 95)
}

/** 视频类型五行 vs 当日五行 + 八字喜用 */
function videoMatchScore(video: VideoType, chart: BaZiChart, dayGanZhi: string): number {
  const dayElems = [
    GAN_WU_XING[dayGanZhi.charAt(0) as TianGan],
    ZHI_WU_XING[dayGanZhi.charAt(1) as DiZhi],
  ]
  let s = 50
  for (const ve of video.elements) {
    for (const de of dayElems) {
      if (ve === de) s += 6
      else if (sheng(ve, de) || sheng(de, ve)) s += 4
    }
    if (chart.favorable.includes(ve)) s += 7
  }
  return clamp(s, 12, 95)
}

/** 计算单日详情（含 12 时辰逐时辰评分） */
function scoreDay(
  chart: BaZiChart,
  video: VideoType,
  y: number,
  m: number,
  d: number,
  platform: string,
  present: PresentDivination,
): DayDetail {
  const huangli = computeHuangLi(y, m, d)
  const dayGanZhi = huangli.dayGanZhi
  const baziDay = baziDayScore(chart, dayGanZhi)
  const videoScore = videoMatchScore(video, chart, dayGanZhi)
  // 日维基线：八字日支 + 黄历 + 视频契合（全天恒定）
  const dayBaselineScore = clamp(
    Math.round(baziDay * 0.45 + huangli.score * 0.3 + videoScore * 0.25),
    0,
    100,
  )
  const ctx: DayContext = { dayGanZhi, dayBaselineScore }

  const fortunes = SHI_CHEN.map((sc) =>
    scoreHourFortune(chart, y, m, d, sc.index, ctx, present),
  )
  const hours = applyTrafficWindow(fortunes, platform)

  const meanFortune =
    fortunes.reduce((a, f) => a + f.fortuneScore, 0) / fortunes.length
  const overall = clamp(Math.round(meanFortune + present.toneShift), 0, 100)
  const qimenAvg = Math.round(
    fortunes.reduce((a, f) => a + f.qimenDayMaster.quality, 0) / fortunes.length,
  )

  return {
    date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    dayGanZhi,
    baziDayScore: baziDay,
    videoScore,
    huangli,
    hours,
    qimenAvg,
    overall,
  }
}

/** 主入口：生成完整择时预测 */
export function computeForecast(
  chart: BaZiChart,
  video: VideoType,
  targetDate: string,
  platform: string,
  now: Date = new Date(),
): Forecast {
  const present = buildPresentDivination(now)
  const d0 = fromYmd(targetDate)
  const target = scoreDay(
    chart,
    video,
    d0.getFullYear(),
    d0.getMonth() + 1,
    d0.getDate(),
    platform,
    present,
  )
  const bestHours = [...target.hours].sort((a, b) => b.score - a.score)

  const forecastDays = getPlatformProfile(platform).forecastDays
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const futureDays: DayScore[] = []
  for (let i = 0; i < forecastDays; i++) {
    const dt = new Date(today)
    dt.setDate(today.getDate() + i)
    const detail = scoreDay(
      chart,
      video,
      dt.getFullYear(),
      dt.getMonth() + 1,
      dt.getDate(),
      platform,
      present,
    )
    futureDays.push({
      date: toYmd(dt),
      weekday: WEEKDAYS[dt.getDay()],
      score: detail.overall,
      dayGanZhi: detail.dayGanZhi,
    })
  }
  const bestDays = [...futureDays].sort((a, b) => b.score - a.score)

  return { target, bestHours, futureDays, bestDays, presentHeadline: present.headline }
}

/** 概率分档文案 */
export function scoreGrade(score: number): { label: string; tone: string } {
  if (score >= 80) return { label: '大吉 · 天时人和', tone: 'gold' }
  if (score >= 65) return { label: '吉 · 顺势可发', tone: 'jade' }
  if (score >= 50) return { label: '平 · 中庸之象', tone: 'parchment' }
  if (score >= 35) return { label: '小凶 · 宜缓不宜急', tone: 'cinnabar' }
  return { label: '凶 · 另择良辰', tone: 'cinnabar' }
}

export interface Decision {
  grade: { label: string; tone: string }
  verdict: 'go' | 'hold' | 'wait' // 今日宜发 / 中平慎发 / 不宜改日
  bestHour: HourScore
  /** 未来有明显更优的日子时给出，否则为 null */
  betterDay: DayScore | null
}

/** 由预测结果生成「今日决策」：一句话回答要不要发、几点发、要不要改日 */
export function buildDecision(forecast: Forecast): Decision {
  const { target, bestHours, bestDays } = forecast
  const bestHour = bestHours[0]
  const top = bestDays[0]
  const betterDay =
    top && top.date !== target.date && top.score >= target.overall + 8 ? top : null

  let verdict: Decision['verdict']
  if (target.overall >= 65) verdict = 'go'
  else if (target.overall >= 45) verdict = 'hold'
  else verdict = 'wait'

  return { grade: scoreGrade(target.overall), verdict, bestHour, betterDay }
}

// 中性视频：videoMatchScore 对空 elements 返回基准 50，用于「与具体视频无关」的日运计算
const NEUTRAL_VIDEO: VideoType = { id: '_neutral', name: '', icon: '', elements: [], desc: '' }

/** 视频类型对八字命局的「长期契合度」（不含当日干支，纯命盘） */
export function videoAffinityScore(video: VideoType, chart: BaZiChart): number {
  let s = 50
  video.elements.forEach((ve, i) => {
    const w = i === 0 ? 1 : 0.6
    if (chart.favorable.includes(ve)) s += 20 * w
    else if (chart.unfavorable.includes(ve)) s -= 14 * w
    for (const fav of chart.favorable) {
      if (sheng(ve, fav)) s += 6 * w
    }
  })
  return clamp(Math.round(s), 12, 96)
}

export interface DailyFortune {
  date: string
  dayGanZhi: string
  dayScore: number
  huangli: HuangLiInfo
  hours: RankedHour[]
  typeRanking: { video: VideoType; score: number }[] // 按当日 videoMatchScore 降序
  presentHeadline: string
}

/** 当日创作运势（与具体视频无关）：供首页 Dashboard */
export function computeDailyFortune(
  chart: BaZiChart,
  date: string,
  platform = '其他',
  now: Date = new Date(),
): DailyFortune {
  const present = buildPresentDivination(now)
  const d0 = fromYmd(date)
  const detail = scoreDay(
    chart,
    NEUTRAL_VIDEO,
    d0.getFullYear(),
    d0.getMonth() + 1,
    d0.getDate(),
    platform,
    present,
  )
  const typeRanking = VIDEO_TYPES.map((video) => ({
    video,
    score: videoMatchScore(video, chart, detail.dayGanZhi),
  })).sort((a, b) => b.score - a.score)

  return {
    date: detail.date,
    dayGanZhi: detail.dayGanZhi,
    dayScore: detail.overall,
    huangli: detail.huangli,
    hours: detail.hours,
    typeRanking,
    presentHeadline: present.headline,
  }
}

/** 自 fromDate 起连续 days 天的日运分（video-中性），供吉日日历 */
export function computeCalendar(
  chart: BaZiChart,
  fromDate: string,
  days: number,
  now: Date = new Date(),
): DayScore[] {
  const present = buildPresentDivination(now)
  const d0 = fromYmd(fromDate)
  const out: DayScore[] = []
  for (let i = 0; i < days; i++) {
    const dt = new Date(d0)
    dt.setDate(d0.getDate() + i)
    const detail = scoreDay(
      chart,
      NEUTRAL_VIDEO,
      dt.getFullYear(),
      dt.getMonth() + 1,
      dt.getDate(),
      '其他',
      present,
    )
    out.push({
      date: toYmd(dt),
      weekday: WEEKDAYS[dt.getDay()],
      score: detail.overall,
      dayGanZhi: detail.dayGanZhi,
    })
  }
  return out
}

export interface ScheduleSlot {
  date: string
  weekday: string
  dayGanZhi: string
  dayScore: number
  bestHour: HourScore
}

/**
 * 批量发布排期：同一视频类型，在 fromDate 起 windowDays 天内
 * 选出 count 个最佳发布日（每日一条，避免同类内容自相分流），
 * 各日附当日最佳时辰。picked 按日期升序，all 为整窗口逐日数据。
 */
export function computeSchedule(
  chart: BaZiChart,
  video: VideoType,
  platform: string,
  fromDate: string,
  windowDays: number,
  count: number,
  now: Date = new Date(),
): { picked: ScheduleSlot[]; all: ScheduleSlot[] } {
  const present = buildPresentDivination(now)
  const d0 = fromYmd(fromDate)
  const all: ScheduleSlot[] = []
  for (let i = 0; i < windowDays; i++) {
    const dt = new Date(d0)
    dt.setDate(d0.getDate() + i)
    const detail = scoreDay(
      chart,
      video,
      dt.getFullYear(),
      dt.getMonth() + 1,
      dt.getDate(),
      platform,
      present,
    )
    const bestHour = [...detail.hours].sort((a, b) => b.score - a.score)[0]
    all.push({
      date: toYmd(dt),
      weekday: WEEKDAYS[dt.getDay()],
      dayGanZhi: detail.dayGanZhi,
      dayScore: detail.overall,
      bestHour,
    })
  }
  const picked = [...all]
    .sort((a, b) => b.dayScore - a.dayScore)
    .slice(0, Math.min(count, windowDays))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  return { picked, all }
}
