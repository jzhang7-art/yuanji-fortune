// 当下问事起局（B）：用户测算那一刻起一局，得「指向时辰」boost + 整体基调修正
import { computeQiMen, evaluateQiMen, type QiMenChart } from '@/domain/qimen'
import { clamp } from '@/util'

export interface PresentDivination {
  chart: QiMenChart
  toneScore: number // 当下局整体吉凶 0–100
  toneShift: number // 整体水位修正（叠加到 overall）
  headline: string // 一句占断文案
  aimBoostByHour: number[] // 长 12，B-指向对各时辰的 boost
}

// 九宫 → 对应时辰（SHI_CHEN index）。中 5 宫无对应时辰。
const PALACE_TO_SHICHEN: Record<number, number[]> = {
  1: [0], // 坎·子
  8: [1, 2], // 艮·丑寅
  3: [3], // 震·卯
  4: [4, 5], // 巽·辰巳
  9: [6], // 离·午
  2: [7, 8], // 坤·未申
  7: [9], // 兑·酉
  6: [10, 11], // 乾·戌亥
}

// 用神门权重（与 evaluateQiMen 内部一致）
const DOOR_WEIGHT: Record<string, number> = { 景门: 0.4, 生门: 0.35, 开门: 0.25 }

/** 由 Date 求时辰序号（子时含 23:00–01:00） */
function shiChenIndexOf(now: Date): number {
  return Math.floor(((now.getHours() + 1) % 24) / 2)
}

/** 起当下局并派生 B-指向 / B-基调 */
export function buildPresentDivination(now: Date): PresentDivination {
  const idx = shiChenIndexOf(now)
  const chart = computeQiMen(now.getFullYear(), now.getMonth() + 1, now.getDate(), idx)
  const evalRes = evaluateQiMen(chart)

  const toneScore = evalRes.score
  const toneShift = Math.round((toneScore - 50) * 0.15) // ±7~8 区间

  const aimBoostByHour = new Array(12).fill(0)
  for (const h of evalRes.highlights) {
    const w = DOOR_WEIGHT[h.door] ?? 0
    const hours = PALACE_TO_SHICHEN[h.palace] ?? []
    const boost = clamp(h.quality - 50, -20, 20) * w
    for (const hourIdx of hours) aimBoostByHour[hourIdx] += boost
  }

  let headline: string
  if (toneScore >= 70) headline = '当下起局，用神得用，此刻谋发布吉，宜顺势而为。'
  else if (toneScore >= 50) headline = '当下起局，时局平稳，发布无大碍，择吉时而动。'
  else headline = '当下起局，用神受制，此刻宜缓，可另择良辰或先打磨内容。'

  return { chart, toneScore, toneShift, headline, aimBoostByHour }
}
