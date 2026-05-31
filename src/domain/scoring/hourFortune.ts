// 第①段：纯命理时辰分（时柱十神 + 神煞 + 奇门日干用神 + 当下局指向 + 日维基线）
// 与平台流量、与"谁在看"无关。
import type { BaZiChart } from '@/domain/bazi'
import { getQiMen } from '@/domain/scoring/qimenCache'
import { evaluateQiMenForDayMaster } from '@/domain/qimen'
import type { QiMenResult } from '@/domain/qimen'
import { shiShenOf } from '@/domain/shishen'
import { SHI_SHEN_SEMANTICS } from '@/data/shiShenSemantics'
import { detectShenSha, type ShenSha } from '@/domain/shensha'
import { GAN_WU_XING, ZHI_WU_XING, SHI_CHEN } from '@/data/ganzhi'
import type { DiZhi, TianGan } from '@/data/ganzhi'
import {
  FORTUNE_WEIGHTS,
  FORTUNE_STRETCH_GAIN,
  SHENSHA_BONUS_CAP,
} from '@/data/scoringConfig'
import type { PresentDivination } from '@/domain/scoring/present'
import { clamp } from '@/util'

export interface DayContext {
  dayGanZhi: string
  dayBaselineScore: number // 0–100，全天恒定（八字日支 + 黄历 + 视频契合）
}

export interface HourFortune {
  shiChenIndex: number
  name: string
  range: string
  hourGanZhi: string
  shiShen: { gan: string; name: string; category: string; semantic: string; score: number }
  shenSha: ShenSha[]
  qimenDayMaster: { palace: number; quality: number; note: string }
  fortuneScore: number // 纯命理 0–100（已拉伸，已含 B-指向）
  reasons: string[]
  // —— 向后兼容现有 HourScore ——
  qimen: QiMenResult // 候选时辰通用奇门（供 UI summary/highlights）
  qimenScore: number // = qimen.score
}

/** 时柱五行 vs 命主喜忌（仿 baziDayScore，作用于时柱干支） */
function favorModifier(chart: BaZiChart, hourGan: TianGan, hourZhi: DiZhi): number {
  let mod = 0
  for (const e of [GAN_WU_XING[hourGan], ZHI_WU_XING[hourZhi]]) {
    if (e === chart.primaryFavorable) mod += 12
    else if (chart.favorable.includes(e)) mod += 7
    else mod -= 9
  }
  return mod
}

export function scoreHourFortune(
  chart: BaZiChart,
  y: number,
  m: number,
  d: number,
  shiChenIndex: number,
  ctx: DayContext,
  present: PresentDivination,
): HourFortune {
  const sc = SHI_CHEN[shiChenIndex]
  const qm = getQiMen(y, m, d, shiChenIndex) // QiMenResult（有 .chart / .score）
  const hourGanZhi = qm.chart.hourGanZhi
  const hourGan = hourGanZhi.charAt(0) as TianGan
  const hourZhi = hourGanZhi.charAt(1) as DiZhi

  // 第 1 层：时柱十神（语义基分 + 喜忌调节）
  const ssName = shiShenOf(chart.dayMaster, hourGan)
  const sem = SHI_SHEN_SEMANTICS[ssName]
  const shiShenScore = clamp(50 + sem.base + favorModifier(chart, hourGan, hourZhi), 5, 95)

  // 第 2 层：神煞
  const shenSha = detectShenSha(chart, hourZhi)
  const shenShaBonus = Math.min(
    shenSha.reduce((a, s) => a + s.bonus, 0),
    SHENSHA_BONUS_CAP,
  )
  const shenShaScore = clamp(50 + shenShaBonus, 0, 100)

  // 第 3 层：奇门日干用神（A）
  const dm = evaluateQiMenForDayMaster(qm.chart, chart.dayMaster)

  // 第 4 层：当下局指向（B-指向）
  const aimScore = clamp(50 + present.aimBoostByHour[shiChenIndex], 0, 100)

  // 聚合 → 拉伸
  const raw =
    shiShenScore * FORTUNE_WEIGHTS.shiShen +
    shenShaScore * FORTUNE_WEIGHTS.shenSha +
    dm.quality * FORTUNE_WEIGHTS.qimenDayMaster +
    aimScore * FORTUNE_WEIGHTS.qimenPresentAim +
    ctx.dayBaselineScore * FORTUNE_WEIGHTS.dayBaseline
  const fortuneScore = clamp(Math.round(50 + (raw - 50) * FORTUNE_STRETCH_GAIN), 0, 100)

  // 解释文案
  const reasons: string[] = [`时柱${hourGanZhi}为${ssName}，${sem.semantic}`]
  for (const s of shenSha) reasons.push(`${s.name}临，${s.semantic}`)
  reasons.push(dm.note)
  if (present.aimBoostByHour[shiChenIndex] > 0) {
    reasons.push('当下起局用神指向此时辰，传播得助力')
  }

  return {
    shiChenIndex,
    name: sc.name,
    range: sc.range,
    hourGanZhi,
    shiShen: {
      gan: hourGan,
      name: ssName,
      category: sem.category,
      semantic: sem.semantic,
      score: shiShenScore,
    },
    shenSha,
    qimenDayMaster: { palace: dm.dayMasterPalace, quality: dm.quality, note: dm.note },
    fortuneScore,
    reasons,
    qimen: qm,
    qimenScore: qm.score,
  }
}
