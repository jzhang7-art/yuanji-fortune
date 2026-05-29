// 五行基础：相生、相克关系与运算

export type WuXing = '木' | '火' | '土' | '金' | '水'

export const WU_XING: WuXing[] = ['木', '火', '土', '金', '水']

// 相生：木→火→土→金→水→木
const SHENG: Record<WuXing, WuXing> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
}

// 相克：木→土→水→火→金→木
const KE: Record<WuXing, WuXing> = {
  木: '土',
  土: '水',
  水: '火',
  火: '金',
  金: '木',
}

/** a 是否生 b */
export function sheng(a: WuXing, b: WuXing): boolean {
  return SHENG[a] === b
}

/** a 是否克 b */
export function ke(a: WuXing, b: WuXing): boolean {
  return KE[a] === b
}

export type WuXingRelation =
  | '同我' // 比和
  | '生我' // 印
  | '我生' // 食伤
  | '克我' // 官杀
  | '我克' // 财

/** 以 self 为中心，判断 other 与 self 的十神类关系 */
export function relation(self: WuXing, other: WuXing): WuXingRelation {
  if (self === other) return '同我'
  if (sheng(other, self)) return '生我'
  if (sheng(self, other)) return '我生'
  if (ke(other, self)) return '克我'
  return '我克'
}

export const WU_XING_COLOR: Record<WuXing, string> = {
  木: '#5a8a6a',
  火: '#b23a2e',
  土: '#c8a45c',
  金: '#d8d4c8',
  水: '#4a6b8a',
}
