// 神煞落时辰：按命主日干/日支查，命中落在给定时支的神煞（个人化择时信号）
import type { BaZiChart } from '@/domain/bazi'
import type { DiZhi, TianGan } from '@/data/ganzhi'

export interface ShenSha {
  name: string
  semantic: string
  bonus: number
}

// 天乙贵人（按日干 → 命中两地支）：甲戊庚丑未 / 乙己子申 / 丙丁亥酉 / 壬癸卯巳 / 辛寅午
// 出处：《奇门遁甲秘笈大全·金函玉镜》——「甲戊庚三日…戊庚贵人起于丑（阳局）/ 起于未（阴局）」「奇遁遇贵格：甲戊庚加丑未之类」。
// 即甲戊庚同组、贵人在丑未（《三命通会》主流口诀「甲戊庚牛羊」）。另有异本作庚→寅午（与辛同），此处采主流。
const TIAN_YI: Record<TianGan, DiZhi[]> = {
  甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
  乙: ['子', '申'], 己: ['子', '申'],
  丙: ['亥', '酉'], 丁: ['亥', '酉'],
  壬: ['卯', '巳'], 癸: ['卯', '巳'],
  辛: ['寅', '午'],
}

// 文昌（按日干 → 命中一地支）
const WEN_CHANG: Record<TianGan, DiZhi> = {
  甲: '巳', 乙: '午', 丙: '申', 戊: '申', 丁: '酉', 己: '酉',
  庚: '亥', 辛: '子', 壬: '寅', 癸: '卯',
}

// 三合局归属：每个地支属于哪一个三合局（用于查驿马/桃花/将星）
const SAN_HE_GROUP: Record<DiZhi, '申子辰' | '寅午戌' | '巳酉丑' | '亥卯未'> = {
  申: '申子辰', 子: '申子辰', 辰: '申子辰',
  寅: '寅午戌', 午: '寅午戌', 戌: '寅午戌',
  巳: '巳酉丑', 酉: '巳酉丑', 丑: '巳酉丑',
  亥: '亥卯未', 卯: '亥卯未', 未: '亥卯未',
}

// 驿马（按日支三合局 → 命中地支）
const YI_MA: Record<string, DiZhi> = {
  申子辰: '寅', 寅午戌: '申', 巳酉丑: '亥', 亥卯未: '巳',
}

// 桃花/咸池（按日支三合局 → 命中地支）
const TAO_HUA: Record<string, DiZhi> = {
  申子辰: '酉', 寅午戌: '卯', 巳酉丑: '午', 亥卯未: '子',
}

// 将星（按日支三合局中神 → 命中地支）
const JIANG_XING: Record<string, DiZhi> = {
  申子辰: '子', 寅午戌: '午', 巳酉丑: '酉', 亥卯未: '卯',
}

/** 给定命盘与某时支，返回落在该时支的神煞列表 */
export function detectShenSha(chart: BaZiChart, hourZhi: DiZhi): ShenSha[] {
  const out: ShenSha[] = []
  const dayGan = chart.day.gan
  const dayZhi = chart.day.zhi
  const group = SAN_HE_GROUP[dayZhi]

  if (TIAN_YI[dayGan]?.includes(hourZhi)) {
    out.push({ name: '天乙贵人', semantic: '贵人相助，易得推流加持', bonus: 8 })
  }
  if (YI_MA[group] === hourZhi) {
    out.push({ name: '驿马', semantic: '流动扩散，内容易跑出圈', bonus: 6 })
  }
  if (TAO_HUA[group] === hourZhi) {
    out.push({ name: '桃花', semantic: '吸引力强，利吸粉涨粉', bonus: 6 })
  }
  if (WEN_CHANG[dayGan] === hourZhi) {
    out.push({ name: '文昌', semantic: '文思才华，利内容质量', bonus: 5 })
  }
  if (JIANG_XING[group] === hourZhi) {
    out.push({ name: '将星', semantic: '统御力强，利权威曝光', bonus: 4 })
  }
  return out
}
