// 奇门遁甲排盘静态数据表
import type { WuXing } from '@/domain/wuxing'

export interface PalaceMeta {
  palace: number
  trigram: string
  direction: string
  star: string // 九星（地盘本位）
  door: string | null // 八门（地盘本位），中宫无门
  element: WuXing
}

// 九宫本位：星、门、卦、五行
export const PALACE_META: Record<number, PalaceMeta> = {
  1: { palace: 1, trigram: '坎', direction: '正北', star: '天蓬', door: '休门', element: '水' },
  2: { palace: 2, trigram: '坤', direction: '西南', star: '天芮', door: '死门', element: '土' },
  3: { palace: 3, trigram: '震', direction: '正东', star: '天冲', door: '伤门', element: '木' },
  4: { palace: 4, trigram: '巽', direction: '东南', star: '天辅', door: '杜门', element: '木' },
  5: { palace: 5, trigram: '中', direction: '中央', star: '天禽', door: null, element: '土' },
  6: { palace: 6, trigram: '乾', direction: '西北', star: '天心', door: '开门', element: '金' },
  7: { palace: 7, trigram: '兑', direction: '正西', star: '天柱', door: '惊门', element: '金' },
  8: { palace: 8, trigram: '艮', direction: '东北', star: '天任', door: '生门', element: '土' },
  9: { palace: 9, trigram: '离', direction: '正南', star: '天英', door: '景门', element: '火' },
}

// 转盘八宫循环顺序（后天八卦顺行，不含中五宫）
export const RING: number[] = [1, 8, 3, 4, 9, 2, 7, 6]

// 中宫寄坤二宫
export const CENTER_LODGE = 2

// 三奇六仪排布顺序（六仪戊己庚辛壬癸 + 三奇丁丙乙）
export const GAN_ORDER = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'] as const

// 旬首对应六仪：甲子旬→戊、甲戌旬→己、甲申旬→庚、甲午旬→辛、甲辰旬→壬、甲寅旬→癸
export const XUN_SHOU_YI = ['戊', '己', '庚', '辛', '壬', '癸'] as const

// 八神（阴阳遁均按此顺序，从值符宫起布）
export const GODS = ['值符', '螣蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'] as const

// 阳遁节气（冬至→芒种）
export const YANG_DUN_JIEQI = new Set([
  '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰',
  '春分', '清明', '谷雨', '立夏', '小满', '芒种',
])

// 二十四节气三元局数表：[上元, 中元, 下元]
export const JU_TABLE: Record<string, [number, number, number]> = {
  // 阳遁
  冬至: [1, 7, 4], 小寒: [2, 8, 5], 大寒: [3, 9, 6],
  立春: [8, 5, 2], 雨水: [9, 6, 3], 惊蛰: [1, 7, 4],
  春分: [3, 9, 6], 清明: [4, 1, 7], 谷雨: [5, 2, 8],
  立夏: [4, 1, 7], 小满: [5, 2, 8], 芒种: [6, 3, 9],
  // 阴遁
  夏至: [9, 3, 6], 小暑: [8, 2, 5], 大暑: [7, 1, 4],
  立秋: [2, 5, 8], 处暑: [1, 4, 7], 白露: [9, 3, 6],
  秋分: [7, 1, 4], 寒露: [6, 9, 3], 霜降: [5, 8, 2],
  立冬: [6, 9, 3], 小雪: [5, 8, 2], 大雪: [4, 7, 1],
}

// 九星吉凶评分（用于择时打分）
export const STAR_SCORE: Record<string, number> = {
  天辅: 10, 天心: 10, 天禽: 8, 天任: 6,
  天英: -2, 天冲: -4, 天柱: -6, 天蓬: -8, 天芮: -12,
}

// 八门吉凶评分
export const DOOR_SCORE: Record<string, number> = {
  开门: 10, 生门: 10, 休门: 8, 景门: 3,
  杜门: -2, 惊门: -6, 伤门: -8, 死门: -12,
}

// 八神吉凶评分
export const GOD_SCORE: Record<string, number> = {
  值符: 10, 九天: 8, 太阴: 8, 六合: 6, 九地: 4,
  螣蛇: -6, 玄武: -6, 白虎: -8,
}

// 八门五行
export const DOOR_ELEMENT: Record<string, WuXing> = {
  休门: '水', 生门: '土', 伤门: '木', 杜门: '木',
  景门: '火', 死门: '土', 惊门: '金', 开门: '金',
}
