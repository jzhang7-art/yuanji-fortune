// 天干、地支、时辰基础数据
import type { WuXing } from '@/domain/wuxing'

export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

export type TianGan = (typeof TIAN_GAN)[number]
export type DiZhi = (typeof DI_ZHI)[number]

export const GAN_WU_XING: Record<TianGan, WuXing> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
}

export const GAN_YIN_YANG: Record<TianGan, '阳' | '阴'> = {
  甲: '阳', 乙: '阴',
  丙: '阳', 丁: '阴',
  戊: '阳', 己: '阴',
  庚: '阳', 辛: '阴',
  壬: '阳', 癸: '阴',
}

// 地支主气五行
export const ZHI_WU_XING: Record<DiZhi, WuXing> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木',
  辰: '土', 巳: '火', 午: '火', 未: '土',
  申: '金', 酉: '金', 戌: '土', 亥: '水',
}

// 十二时辰：序号、名称、地支、代表小时（用于排八字时柱）、起止描述
export interface ShiChen {
  index: number
  zhi: DiZhi
  name: string
  hour: number // 代表小时
  range: string
}

export const SHI_CHEN: ShiChen[] = [
  { index: 0, zhi: '子', name: '子时', hour: 0, range: '23:00–01:00' },
  { index: 1, zhi: '丑', name: '丑时', hour: 2, range: '01:00–03:00' },
  { index: 2, zhi: '寅', name: '寅时', hour: 4, range: '03:00–05:00' },
  { index: 3, zhi: '卯', name: '卯时', hour: 6, range: '05:00–07:00' },
  { index: 4, zhi: '辰', name: '辰时', hour: 8, range: '07:00–09:00' },
  { index: 5, zhi: '巳', name: '巳时', hour: 10, range: '09:00–11:00' },
  { index: 6, zhi: '午', name: '午时', hour: 12, range: '11:00–13:00' },
  { index: 7, zhi: '未', name: '未时', hour: 14, range: '13:00–15:00' },
  { index: 8, zhi: '申', name: '申时', hour: 16, range: '15:00–17:00' },
  { index: 9, zhi: '酉', name: '酉时', hour: 18, range: '17:00–19:00' },
  { index: 10, zhi: '戌', name: '戌时', hour: 20, range: '19:00–21:00' },
  { index: 11, zhi: '亥', name: '亥时', hour: 22, range: '21:00–23:00' },
]

/** 干支字符串（如「庚午」）→ 在六十甲子中的序号 0–59 */
export function jiaZiIndex(ganZhi: string): number {
  const gan = ganZhi.charAt(0)
  const zhi = ganZhi.charAt(1)
  const g = TIAN_GAN.indexOf(gan as TianGan)
  const z = DI_ZHI.indexOf(zhi as DiZhi)
  if (g < 0 || z < 0) return -1
  // 解方程 index ≡ g (mod 10), index ≡ z (mod 12)
  for (let i = 0; i < 60; i++) {
    if (i % 10 === g && i % 12 === z) return i
  }
  return -1
}
