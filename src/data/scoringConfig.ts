// 评分引擎权重配置（集中管理，便于调参）

export const SCORE_WEIGHTS = {
  bazi: 0.35, // 八字喜用神 vs 当日干支
  huangli: 0.25, // 当日黄历宜忌
  qimen: 0.25, // 奇门遁甲时局
  videoMatch: 0.15, // 视频类型五行契合度
} as const

// 未来最佳日期预测的兜底天数（无平台档案时使用）
export const FORECAST_DAYS = 7

// 平台
export const PLATFORMS = ['抖音', '小红书', '视频号', 'B站', '快手', '其他'] as const

// 平台流量在「时辰分」中的权重——次要辅助，命理为主
export const PLATFORM_HOUR_WEIGHT = 0.12

// hourScores ≥ 此值的时辰视为「流量高峰」，用于 UI 打标
export const PLATFORM_PEAK_THRESHOLD = 80

export interface PlatformProfile {
  forecastDays: number // 发布吉日预测天数
  hourScores: number[] // 12 时辰真实流量强度（0–100，按 SHI_CHEN 的 index 对齐）
}

// 各平台档案：预测周期 + 12 时辰流量强度
//        子   丑   寅   卯   辰   巳   午   未   申   酉   戌   亥
export const PLATFORM_PROFILES: Record<string, PlatformProfile> = {
  抖音: {
    forecastDays: 1,
    hourScores: [45, 20, 15, 25, 45, 55, 80, 60, 55, 70, 92, 95],
  },
  快手: {
    forecastDays: 1,
    hourScores: [45, 25, 25, 45, 60, 60, 75, 60, 55, 70, 88, 85],
  },
  小红书: {
    forecastDays: 2,
    hourScores: [55, 25, 15, 25, 40, 55, 78, 62, 55, 65, 85, 90],
  },
  视频号: {
    forecastDays: 2,
    hourScores: [30, 15, 15, 45, 70, 65, 72, 58, 52, 62, 88, 78],
  },
  B站: {
    forecastDays: 7,
    hourScores: [70, 35, 20, 18, 30, 42, 68, 55, 55, 65, 88, 95],
  },
  其他: {
    forecastDays: 1,
    hourScores: [45, 25, 20, 35, 50, 55, 72, 58, 52, 62, 85, 82],
  },
}

/** 取平台档案，未知平台回落到「其他」 */
export function getPlatformProfile(platform: string): PlatformProfile {
  return PLATFORM_PROFILES[platform] ?? PLATFORM_PROFILES['其他']
}

// —— 时辰个人化命理引擎配置 ——

// 命理四层 + 日维基线权重（和为 1），用于合成 fortuneScore
export const FORTUNE_WEIGHTS = {
  shiShen: 0.38, // 时柱十神（含喜忌调节）
  shenSha: 0.12, // 神煞落时辰
  qimenDayMaster: 0.18, // 奇门·候选时辰日干用神
  qimenPresentAim: 0.12, // 奇门·当下局指向
  dayBaseline: 0.2, // 日维基线（八字日支 + 黄历 + 视频契合）
} as const

// 区分度拉伸增益：stretched = 50 + (raw - 50) * GAIN
export const FORTUNE_STRETCH_GAIN = 1.5

// 神煞 bonus 求和封顶
export const SHENSHA_BONUS_CAP = 18

// 流量窗口：>= 活跃阈值 命理全权决定；以下按比例降权到地板
export const TRAFFIC_ACTIVE_THRESHOLD = 50
export const TRAFFIC_FACTOR_FLOOR = 0.68
// 低于此流量标注「流量低谷」
export const TRAFFIC_LOW_THRESHOLD = 40
