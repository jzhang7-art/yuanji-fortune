// 时家奇门遁甲排盘（拆补法定局 + 转盘法排盘）
import { Solar } from 'lunar-typescript'
import type { WuXing } from '@/domain/wuxing'
import { ke, sheng } from '@/domain/wuxing'
import { jiaZiIndex, SHI_CHEN } from '@/data/ganzhi'
import { clamp } from '@/util'
import {
  CENTER_LODGE,
  DOOR_ELEMENT,
  DOOR_SCORE,
  GAN_ORDER,
  GOD_SCORE,
  GODS,
  JU_TABLE,
  PALACE_META,
  RING,
  STAR_SCORE,
  XUN_SHOU_YI,
  YANG_DUN_JIEQI,
} from '@/domain/qimen/tables'

export interface PalaceState {
  palace: number
  trigram: string
  direction: string
  element: WuXing
  earthGan: string // 地盘三奇六仪
  skyGan: string // 天盘三奇六仪
  star: string // 九星（天盘）
  door: string | null // 八门
  god: string // 八神
}

export interface QiMenChart {
  dunType: '阳遁' | '阴遁'
  juShu: number
  jieQi: string
  yuan: '上元' | '中元' | '下元'
  dayGanZhi: string
  hourGanZhi: string
  zhiFuStar: string
  zhiShiDoor: string
  palaces: Record<number, PalaceState>
}

export interface QiMenResult {
  chart: QiMenChart
  score: number // 0–100
  summary: string
  highlights: { label: string; palace: number; door: string; quality: number }[]
}

const YUAN_NAMES = ['上元', '中元', '下元'] as const

function buildGround(juShu: number, isYang: boolean): Record<number, string> {
  const g: Record<number, string> = {}
  for (let i = 0; i < 9; i++) {
    const offset = isYang ? i : -i
    const p = (((juShu - 1 + offset) % 9) + 9) % 9 + 1
    g[p] = GAN_ORDER[i]
  }
  return g
}

function ringIdx(palace: number): number {
  return RING.indexOf(palace === 5 ? CENTER_LODGE : palace)
}

function palaceOfGan(ground: Record<number, string>, gan: string): number {
  for (let p = 1; p <= 9; p++) {
    if (ground[p] === gan) return p
  }
  return 5
}

/** 拆补法定局：返回阴阳遁、局数、节气、三元 */
function determineJu(year: number, month: number, day: number) {
  // 向前回溯找最近的符头日（日干为甲或己）
  let fuTouSolar = Solar.fromYmdHms(year, month, day, 12, 0, 0)
  for (let back = 0; back < 10; back++) {
    const s = Solar.fromYmdHms(year, month, day, 12, 0, 0).next(-back)
    const gz = s.getLunar().getDayInGanZhi()
    if (gz.charAt(0) === '甲' || gz.charAt(0) === '己') {
      fuTouSolar = s
      break
    }
  }
  const fuTouZhi = fuTouSolar.getLunar().getDayInGanZhi().charAt(1)
  let yuanIdx = 2
  if ('子午卯酉'.includes(fuTouZhi)) yuanIdx = 0
  else if ('寅申巳亥'.includes(fuTouZhi)) yuanIdx = 1
  const jieQi = fuTouSolar.getLunar().getPrevJieQi(true).getName()
  const ju = JU_TABLE[jieQi]
  const isYang = YANG_DUN_JIEQI.has(jieQi)
  const juShu = ju ? ju[yuanIdx] : 1
  return { isYang, juShu, jieQi, yuan: YUAN_NAMES[yuanIdx] }
}

/** 排盘主函数 */
export function computeQiMen(
  year: number,
  month: number,
  day: number,
  shiChenIndex: number,
): QiMenChart {
  const sc = SHI_CHEN[shiChenIndex]
  const solar = Solar.fromYmdHms(year, month, day, sc.hour, 0, 0)
  const lunar = solar.getLunar()
  const dayGanZhi = lunar.getDayInGanZhi()
  const hourGanZhi = lunar.getTimeInGanZhi()

  const { isYang, juShu, jieQi, yuan } = determineJu(year, month, day)
  const dir = isYang ? 1 : -1
  const ground = buildGround(juShu, isYang)

  // 旬与旬首
  const hourIdx = jiaZiIndex(hourGanZhi)
  const xun = Math.floor(hourIdx / 10)
  const stepsInXun = hourIdx - xun * 10
  const xunShouYi = XUN_SHOU_YI[xun]

  const zhiFuGround = palaceOfGan(ground, xunShouYi)
  const zhiFuStar = PALACE_META[zhiFuGround].star
  const zhiShiDoor = PALACE_META[zhiFuGround].door ?? PALACE_META[CENTER_LODGE].door!

  // 时干上盘（甲遁旬首六仪）
  const hourGan = hourGanZhi.charAt(0)
  const hourGanBoard = hourGan === '甲' ? xunShouYi : hourGan
  const hourGanGround = palaceOfGan(ground, hourGanBoard)

  // 天盘九星与天盘干（转盘）：值符星随时干
  const kStar = (((ringIdx(hourGanGround) - ringIdx(zhiFuGround)) % 8) + 8) % 8
  const skyStar: Record<number, string> = {}
  const skyGan: Record<number, string> = {}
  for (const gp of RING) {
    const tgt = RING[(RING.indexOf(gp) + kStar) % 8]
    skyStar[tgt] = PALACE_META[gp].star
    skyGan[tgt] = ground[gp]
  }
  skyStar[5] = '天禽'
  skyGan[5] = ground[5]

  // 八门转盘：值使门自值符宫起，按时辰地支数沿九宫数序移动（阳顺阴逆，含中五宫）。
  // 注意——九星/八神沿 RING（洛书轨迹）转，八门值使却沿宫位数序 1→2→…→9→1 转，二者不同。
  let zhiShiPalace = zhiFuGround
  for (let s = 0; s < stepsInXun; s++) {
    zhiShiPalace = ((zhiShiPalace - 1 + dir + 9) % 9) + 1
  }
  const kDoor = (((ringIdx(zhiShiPalace) - ringIdx(zhiFuGround)) % 8) + 8) % 8
  const doorAt: Record<number, string | null> = { 5: null }
  for (const gp of RING) {
    const tgt = RING[(RING.indexOf(gp) + kDoor) % 8]
    doorAt[tgt] = PALACE_META[gp].door
  }

  // 八神：值符神随值符星（落于时干宫），按遁向布列
  const godAt: Record<number, string> = {}
  const startRing = ringIdx(hourGanGround)
  for (let i = 0; i < 8; i++) {
    const p = RING[(((startRing + dir * i) % 8) + 8) % 8]
    godAt[p] = GODS[i]
  }
  godAt[5] = godAt[CENTER_LODGE]

  const palaces: Record<number, PalaceState> = {}
  for (let p = 1; p <= 9; p++) {
    const meta = PALACE_META[p]
    palaces[p] = {
      palace: p,
      trigram: meta.trigram,
      direction: meta.direction,
      element: meta.element,
      earthGan: ground[p],
      skyGan: skyGan[p],
      star: skyStar[p],
      door: doorAt[p] ?? null,
      god: godAt[p],
    }
  }

  return {
    dunType: isYang ? '阳遁' : '阴遁',
    juShu,
    jieQi,
    yuan,
    dayGanZhi,
    hourGanZhi,
    zhiFuStar,
    zhiShiDoor,
    palaces,
  }
}

/** 单宫吉凶质量评分 0–100 */
function palaceQuality(ps: PalaceState): number {
  let s = 50
  s += STAR_SCORE[ps.star] ?? 0
  s += GOD_SCORE[ps.god] ?? 0
  if (ps.door) {
    s += (DOOR_SCORE[ps.door] ?? 0) * 0.5
    const de = DOOR_ELEMENT[ps.door]
    const pe = ps.element
    if (de === pe) s += 2
    else if (sheng(pe, de)) s += 4 // 宫生门
    else if (ke(pe, de)) s -= 4 // 宫克门（门迫）
    else if (ke(de, pe)) s -= 2
  }
  return clamp(s, 5, 95)
}

function findDoorPalace(chart: QiMenChart, door: string): PalaceState {
  for (let p = 1; p <= 9; p++) {
    if (chart.palaces[p].door === door) return chart.palaces[p]
  }
  return chart.palaces[9]
}

/**
 * 针对「自媒体发布」择时评估。
 * 用神：景门（内容/信息）、生门（受众/人气）、开门（曝光/名气）
 */
export function evaluateQiMen(chart: QiMenChart): QiMenResult {
  const targets: { label: string; door: string; weight: number }[] = [
    { label: '内容传播（景门）', door: '景门', weight: 0.4 },
    { label: '受众人气（生门）', door: '生门', weight: 0.35 },
    { label: '曝光名气（开门）', door: '开门', weight: 0.25 },
  ]

  const highlights = targets.map((t) => {
    const ps = findDoorPalace(chart, t.door)
    return {
      label: t.label,
      palace: ps.palace,
      door: t.door,
      quality: Math.round(palaceQuality(ps)),
      weight: t.weight,
    }
  })

  const score = clamp(
    highlights.reduce((sum, h) => sum + h.quality * h.weight, 0),
    0,
    100,
  )

  const best = [...highlights].sort((a, b) => b.quality - a.quality)[0]
  let summary: string
  if (score >= 70) summary = `奇门时局得用，${best.label}落${PALACE_META[best.palace].trigram}宫，宜传播。`
  else if (score >= 50) summary = `奇门时局平稳，${best.label}尚可，发布无大碍。`
  else summary = `奇门时局欠佳，用神门受制，建议另择吉时。`

  return {
    chart,
    score: Math.round(score),
    summary,
    highlights: highlights.map(({ label, palace, door, quality }) => ({
      label,
      palace,
      door,
      quality,
    })),
  }
}
