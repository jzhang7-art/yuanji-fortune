// 子平八字排盘与命理判定：五行力量秤（含地支藏干）定旺衰，
// 扶抑 + 调候定喜用神，十神定创作特质。
import { Solar } from 'lunar-typescript'
import type { WuXing } from '@/domain/wuxing'
import { relation, sheng, WU_XING } from '@/domain/wuxing'
import { GAN_WU_XING, ZHI_WU_XING } from '@/data/ganzhi'
import type { DiZhi, TianGan } from '@/data/ganzhi'
import { SHI_CHEN } from '@/data/ganzhi'
import { clamp } from '@/util'

export interface BaZiInput {
  year: number
  month: number
  day: number
  shiChenIndex: number // 0–11
  gender: '男' | '女'
}

export interface Pillar {
  label: string
  gan: TianGan
  zhi: DiZhi
  ganWuXing: WuXing
  zhiWuXing: WuXing
}

export interface BaZiChart {
  input: BaZiInput
  year: Pillar
  month: Pillar
  day: Pillar
  time: Pillar
  dayMaster: TianGan
  dayMasterWuXing: WuXing
  wuXingPower: Record<WuXing, number> // 五行力量分布（含藏干、月令加权）
  strength: '偏旺' | '偏弱' | '中和'
  strengthScore: number // 旺衰指数 0–100（50 为中和基准）
  favorable: WuXing[] // 喜用神五行
  unfavorable: WuXing[] // 忌神五行
  primaryFavorable: WuXing // 用神（首要喜用五行）
  tiaoHou: WuXing | null // 调候用神五行（春秋月为 null）
  dominantShiShen: string // 主导十神类：比劫/印/食伤/财/官杀
  talentReading: string // 创作特质解读
  analysis: string
}

// 地支藏干权重：本气 / 中气 / 余气（按支实际藏干数归一化）
const HIDE_WEIGHT = [0.6, 0.3, 0.1]
const GAN_WEIGHT = 10 // 单个天干力量
const ZHI_WEIGHT = 12 // 单个地支（藏干合计）力量
const MONTH_MULT = 2.4 // 月柱司令加权（得令）

// 十神 → 类别
const SHI_SHEN_CAT: Record<string, string> = {
  比肩: '比劫', 劫财: '比劫',
  食神: '食伤', 伤官: '食伤',
  正财: '财', 偏财: '财',
  正官: '官杀', 七杀: '官杀',
  正印: '印', 偏印: '印',
}

const TALENT_READING: Record<string, string> = {
  食伤: '命带食伤，表达与创意是你的天赋——内容贵在个人风格与观点输出。',
  官杀: '命带官杀，主名声与影响力——走专业、权威路线更易立住。',
  印: '命带印星，主学识涵养——知识深度型内容是你的长板。',
  比劫: '命带比劫，自我与行动力强——人格化、真实记录型内容更契合。',
  财: '命带财星，务实重结果——实用、变现导向的内容更适合你。',
}

function makePillar(label: string, ganZhi: string): Pillar {
  const gan = ganZhi.charAt(0) as TianGan
  const zhi = ganZhi.charAt(1) as DiZhi
  return {
    label,
    gan,
    zhi,
    ganWuXing: GAN_WU_XING[gan],
    zhiWuXing: ZHI_WU_XING[zhi],
  }
}

/** 五行力量秤：天干 + 地支藏干（本气/中气/余气）按权重归集，月柱司令加权 */
function computeWuXingPower(
  pillars: { gz: string; hide: string[]; isMonth: boolean }[],
): Record<WuXing, number> {
  const power: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  for (const p of pillars) {
    const mult = p.isMonth ? MONTH_MULT : 1
    // 天干
    const ganWx = GAN_WU_XING[p.gz.charAt(0) as TianGan]
    if (ganWx) power[ganWx] += GAN_WEIGHT * mult
    // 地支藏干（按实际藏干数归一化权重）
    const w = HIDE_WEIGHT.slice(0, p.hide.length)
    const wSum = w.reduce((a, b) => a + b, 0) || 1
    p.hide.forEach((g, i) => {
      const wx = GAN_WU_XING[g as TianGan]
      if (wx) power[wx] += ZHI_WEIGHT * ((w[i] ?? 0) / wSum) * mult
    })
  }
  return power
}

/** 由出生信息排出八字命盘并作命理判定 */
export function computeBaZi(input: BaZiInput): BaZiChart {
  const sc = SHI_CHEN[input.shiChenIndex]
  const solar = Solar.fromYmdHms(input.year, input.month, input.day, sc.hour, 0, 0)
  const ec = solar.getLunar().getEightChar()

  const year = makePillar('年柱', ec.getYear())
  const month = makePillar('月柱', ec.getMonth())
  const day = makePillar('日柱', ec.getDay())
  const time = makePillar('时柱', ec.getTime())

  const dayMaster = day.gan
  const dayMasterWuXing = GAN_WU_XING[dayMaster]

  // —— 五行力量秤 ——
  const wuXingPower = computeWuXingPower([
    { gz: ec.getYear(), hide: ec.getYearHideGan(), isMonth: false },
    { gz: ec.getMonth(), hide: ec.getMonthHideGan(), isMonth: true },
    { gz: ec.getDay(), hide: ec.getDayHideGan(), isMonth: false },
    { gz: ec.getTime(), hide: ec.getTimeHideGan(), isMonth: false },
  ])

  // —— 旺衰：帮身力（同我比劫 + 生我印）÷ 全局总力 ——
  const yinWuXing = WU_XING.find((x) => sheng(x, dayMasterWuXing))! // 生我者
  const total = WU_XING.reduce((s, x) => s + wuXingPower[x], 0) || 1
  const support = wuXingPower[dayMasterWuXing] + wuXingPower[yinWuXing]
  const ratio = support / total
  // 五行均衡时帮身占 2/5≈0.40，故以 0.40 为中和基准映射到 50 分
  const strengthScore = clamp(Math.round(50 + (ratio - 0.4) * 200), 0, 100)
  const strength: BaZiChart['strength'] =
    strengthScore >= 66 ? '偏旺' : strengthScore <= 36 ? '偏弱' : '中和'

  // —— 喜用神：扶抑 ——
  const favRels =
    strength === '偏弱'
      ? ['生我', '同我']
      : strength === '偏旺'
        ? ['我生', '我克', '克我']
        : ['我生', '我克']
  let favorable = WU_XING.filter((e) => favRels.includes(relation(dayMasterWuXing, e)))

  // —— 喜用神：调候（优先级高，调候为急）——
  let tiaoHou: WuXing | null = null
  if ('亥子丑'.includes(month.zhi)) tiaoHou = '火'
  else if ('巳午未'.includes(month.zhi)) tiaoHou = '水'
  if (tiaoHou && !favorable.includes(tiaoHou)) favorable = [...favorable, tiaoHou]

  const unfavorable = WU_XING.filter((e) => !favorable.includes(e))
  const primaryFavorable: WuXing =
    tiaoHou ??
    (strength === '偏弱'
      ? yinWuXing // 身弱以印为用
      : WU_XING.find((x) => relation(dayMasterWuXing, x) === '我生')!) // 否则以食伤泄秀为用

  // —— 十神：定创作特质 ——
  const shiShenList = [
    ec.getYearShiShenGan(),
    ec.getMonthShiShenGan(),
    ec.getTimeShiShenGan(),
    ...ec.getYearShiShenZhi().slice(0, 1),
    ...ec.getMonthShiShenZhi().slice(0, 1),
    ...ec.getDayShiShenZhi().slice(0, 1),
    ...ec.getTimeShiShenZhi().slice(0, 1),
  ]
  const catCount: Record<string, number> = {}
  for (const ss of shiShenList) {
    const cat = SHI_SHEN_CAT[ss]
    if (cat) catCount[cat] = (catCount[cat] ?? 0) + 1
  }
  const dominantShiShen =
    Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '比劫'
  const talentReading = TALENT_READING[dominantShiShen] ?? TALENT_READING['比劫']

  // —— 命理大师口吻解读 ——
  const monthWx = ZHI_WU_XING[month.zhi]
  const monthRel = relation(dayMasterWuXing, monthWx)
  const deLing = monthRel === '同我' || monthRel === '生我'
  const tiaoHouText = tiaoHou
    ? `${'亥子丑'.includes(month.zhi) ? '冬' : '夏'}月生，调候以${tiaoHou}${tiaoHou === '火' ? '暖' : '润'}局为急。`
    : ''
  const analysis =
    `日主${dayMaster}（${dayMasterWuXing}），生于${month.zhi}月${deLing ? '得令' : '失令'}，` +
    `命局${strength}（旺衰指数 ${strengthScore}）。${tiaoHouText}` +
    `喜用${favorable.join('、')}，发布内容契合喜用之气，运势更顺。`

  return {
    input,
    year,
    month,
    day,
    time,
    dayMaster,
    dayMasterWuXing,
    wuXingPower,
    strength,
    strengthScore,
    favorable,
    unfavorable,
    primaryFavorable,
    tiaoHou,
    dominantShiShen,
    talentReading,
    analysis,
  }
}
