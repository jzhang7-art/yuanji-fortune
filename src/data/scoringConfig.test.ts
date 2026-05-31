import { describe, expect, it } from 'vitest'
import {
  FORTUNE_WEIGHTS,
  FORTUNE_STRETCH_GAIN,
  SHENSHA_BONUS_CAP,
  TRAFFIC_ACTIVE_THRESHOLD,
  TRAFFIC_FACTOR_FLOOR,
  TRAFFIC_LOW_THRESHOLD,
} from '@/data/scoringConfig'

describe('命理评分配置', () => {
  it('命理四层 + 日维基线权重和为 1', () => {
    const sum =
      FORTUNE_WEIGHTS.shiShen +
      FORTUNE_WEIGHTS.shenSha +
      FORTUNE_WEIGHTS.qimenDayMaster +
      FORTUNE_WEIGHTS.qimenPresentAim +
      FORTUNE_WEIGHTS.dayBaseline
    expect(sum).toBeCloseTo(1, 5)
  })

  it('阈值取值合理', () => {
    expect(FORTUNE_STRETCH_GAIN).toBeGreaterThan(1)
    expect(SHENSHA_BONUS_CAP).toBeGreaterThan(0)
    expect(TRAFFIC_FACTOR_FLOOR).toBeGreaterThan(0)
    expect(TRAFFIC_FACTOR_FLOOR).toBeLessThan(1)
    expect(TRAFFIC_LOW_THRESHOLD).toBeLessThan(TRAFFIC_ACTIVE_THRESHOLD)
  })
})
