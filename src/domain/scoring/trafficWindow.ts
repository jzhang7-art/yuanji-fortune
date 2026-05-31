// 第②段：流量窗口惩罚 + 标注。流量不进命理分，只做末端重排。
import type { HourFortune } from '@/domain/scoring/hourFortune'
import {
  getPlatformProfile,
  PLATFORM_PEAK_THRESHOLD,
  TRAFFIC_ACTIVE_THRESHOLD,
  TRAFFIC_FACTOR_FLOOR,
  TRAFFIC_LOW_THRESHOLD,
} from '@/data/scoringConfig'
import { clamp } from '@/util'

export interface RankedHour extends HourFortune {
  trafficScore: number
  trafficFactor: number
  finalScore: number
  platformPeak: boolean
  lowTraffic: boolean
  // —— 向后兼容现有 HourScore：score = finalScore ——
  score: number
}

export function applyTrafficWindow(
  fortunes: HourFortune[],
  platform: string,
): RankedHour[] {
  const profile = getPlatformProfile(platform)
  return fortunes.map((f) => {
    const trafficScore = profile.hourScores[f.shiChenIndex] ?? 50
    const trafficFactor =
      trafficScore >= TRAFFIC_ACTIVE_THRESHOLD
        ? 1
        : TRAFFIC_FACTOR_FLOOR +
          (1 - TRAFFIC_FACTOR_FLOOR) * (trafficScore / TRAFFIC_ACTIVE_THRESHOLD)
    const finalScore = clamp(Math.round(f.fortuneScore * trafficFactor), 0, 100)
    return {
      ...f,
      trafficScore,
      trafficFactor,
      finalScore,
      score: finalScore,
      platformPeak: trafficScore >= PLATFORM_PEAK_THRESHOLD,
      lowTraffic: trafficScore < TRAFFIC_LOW_THRESHOLD,
    }
  })
}
