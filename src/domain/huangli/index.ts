// 黄历吉凶模块：按择吉学（黄道黑道 / 建除十二神 / 二十八宿 / 神煞 / 宜忌）
// 综合判定某日对「自媒体发布」的吉凶。
import { Solar } from 'lunar-typescript'
import { clamp } from '@/util'

// 与「内容传播 / 曝光 / 社交」相关的黄历吉事
const PUBLISH_AUSPICIOUS = [
  '出行', '会友', '会亲友', '开市', '交易', '立券', '纳财', '求财',
  '见贵', '赴任', '上书', '进人口', '纳采', '宴会', '谒见', '出火',
  '祈福', '开光', '求嗣', '订盟', '移徙',
]

// 黄道黑道十二神 → 分值（择吉主干判据，权重最重）
const TIAN_SHEN_SCORE: Record<string, number> = {
  青龙: 18, 天德: 16, 明堂: 14, 金匮: 13, 玉堂: 12, 司命: 11,
  白虎: -18, 天刑: -15, 朱雀: -14, 玄武: -13, 天牢: -12, 勾陈: -11,
}
// 十二天神之名——吉神/凶煞计分时排除，避免与天神维度重复计分
const TIAN_SHEN_NAMES = new Set(Object.keys(TIAN_SHEN_SCORE))

// 建除十二神 → 分值（成、开 最利「求名、开市、传播」；破 最凶）
const ZHI_XING_SCORE: Record<string, number> = {
  成: 12, 开: 12, 除: 10, 定: 9, 危: 8, 执: 8,
  建: -6, 平: -6, 满: -7, 收: -8, 闭: -10, 破: -14,
}

// 利「张扬、展开、传播」的二十八宿
const PUBLISH_XIU = new Set(['张', '房', '角', '室', '壁', '毕'])

// 吉神分级
const JI_SHEN_TOP = new Set(['天德', '月德', '天德合', '月德合', '天赦', '天愿', '天恩'])
const JI_SHEN_PUBLISH = new Set(['驿马', '天马', '天喜']) // 利扩散、互动
const JI_SHEN_GOOD = new Set([
  '三合', '六合', '月恩', '福德', '生气', '阳德', '阴德', '天医', '五富', '福生', '天巫', '天仓',
])

// 凶煞分级
const XIONG_HEAVY = new Set(['往亡', '大煞', '死神', '致死', '月厌', '月煞', '月虚', '五墓'])
const XIONG_MED = new Set([
  '咸池', '大时', '灾煞', '血忌', '血支', '五虚', '五离', '归忌', '天贼', '劫煞', '月害', '月刑',
  '死气', '重日', '复日', '四废', '四穷', '四忌', '四耗', '四击', '河魁', '天罡', '天狗', '天火',
  '地火', '九空', '九坎', '九焦', '土府', '土符',
])

// 一票否决的大凶日：日值此类者纵有它吉亦不用
const FATAL_SHA = ['月破', '岁破', '受死', '四绝', '四离']

export interface QiChang {
  level: '旺' | '平' | '弱'
  label: string // 「传播气场 · 旺」
  reading: string // 创作者向解读句
}

export interface HuangLiInfo {
  dayGanZhi: string
  yi: string[]
  ji: string[]
  chongDesc: string
  sha: string
  jiShen: string[]
  xiongSha: string[]
  xiu: string
  xiuLuck: string // 二十八宿吉凶：吉 / 凶
  tianShen: string // 黄道黑道十二神：青龙、白虎…
  tianShenType: string // 黄道 / 黑道
  zhiXing: string // 建除十二神：建、除…
  animal: string
  matchedYi: string[]
  matchedJi: string[]
  fatalSha: string[] // 命中的一票否决大凶煞，未命中为空
  score: number // 0–100
  qiChang: QiChang
}

/** 把择吉判据翻译为创作者可读的「传播气场」解读 */
function buildQiChang(d: {
  tianShen: string
  tianShenType: string
  zhiXing: string
  xiu: string
  xiuLuck: string
  fatalSha: string[]
  score: number
}): QiChang {
  const level: QiChang['level'] = d.score >= 62 ? '旺' : d.score >= 44 ? '平' : '弱'
  const shen = d.tianShen ? `${d.tianShen}${d.tianShenType}` : '今日'
  const zhi = d.zhiXing ? `、值「${d.zhiXing}」日` : ''
  const xiuPart = d.xiu
    ? `，${d.xiu}宿${d.xiuLuck === '吉' ? '得吉' : d.xiuLuck === '凶' ? '主凶' : ''}`
    : ''

  let reading: string
  if (d.fatalSha.length > 0) {
    reading = `今日犯「${d.fatalSha.join('、')}」大凶，${shen}${zhi}——气场闭塞，纵有它吉亦难补，宜静不宜发，另择良辰。`
  } else if (level === '旺') {
    reading = `今日${shen}${zhi}${xiuPart}，传播气场旺盛——利于推送追求曝光与互动的内容。`
  } else if (level === '弱') {
    reading = `今日${shen}${zhi}${xiuPart}，传播气场偏弱——内容自然扩散的动能不足，重曝光的视频可缓一缓。`
  } else {
    reading = `今日${shen}${zhi}${xiuPart}，吉凶相参，传播气场平平。`
  }
  return { level, label: `传播气场 · ${level}`, reading }
}

/** 取某日黄历并按择吉学综合评估自媒体发布吉凶 */
export function computeHuangLi(year: number, month: number, day: number): HuangLiInfo {
  const lunar = Solar.fromYmdHms(year, month, day, 12, 0, 0).getLunar()

  const yi = safeArr(() => lunar.getDayYi())
  const ji = safeArr(() => lunar.getDayJi())
  const jiShen = safeArr(() => lunar.getDayJiShen())
  const xiongSha = safeArr(() => lunar.getDayXiongSha())
  const tianShen = safeStr(() => lunar.getDayTianShen())
  const tianShenType = safeStr(() => lunar.getDayTianShenType())
  const zhiXing = safeStr(() => lunar.getZhiXing())
  const xiu = safeStr(() => lunar.getXiu())
  const xiuLuck = safeStr(() => lunar.getXiuLuck())

  const matchedYi = PUBLISH_AUSPICIOUS.filter((x) => yi.includes(x))
  const matchedJi = PUBLISH_AUSPICIOUS.filter((x) => ji.includes(x))
  const fatalSha = FATAL_SHA.filter((s) => xiongSha.some((x) => x.includes(s)))

  let score = 50

  // 1. 黄道黑道十二神（主干，权重最重）
  score += TIAN_SHEN_SCORE[tianShen] ?? 0

  // 2. 建除十二神
  score += ZHI_XING_SCORE[zhiXing] ?? 0

  // 3. 二十八宿
  if (xiuLuck === '吉') score += 6
  else if (xiuLuck === '凶') score -= 6
  if (PUBLISH_XIU.has(xiu)) score += 3

  // 4. 吉神 / 凶煞（排除已计入天神维度的十二天神名，避免重复）
  let jiShenPts = 0
  for (const s of jiShen) {
    if (TIAN_SHEN_NAMES.has(s)) continue
    if (JI_SHEN_TOP.has(s)) jiShenPts += 4
    else if (JI_SHEN_PUBLISH.has(s)) jiShenPts += 3.5
    else if (JI_SHEN_GOOD.has(s)) jiShenPts += 2
    else jiShenPts += 1
  }
  score += Math.min(jiShenPts, 12)

  let xiongPts = 0
  for (const s of xiongSha) {
    if (TIAN_SHEN_NAMES.has(s)) continue
    if (XIONG_HEAVY.has(s)) xiongPts += 4
    else if (XIONG_MED.has(s)) xiongPts += 2
    else xiongPts += 1
  }
  score -= Math.min(xiongPts, 12)

  // 5. 宜忌匹配（末端微调，不再当主判据）
  score += Math.min(matchedYi.length * 2, 6)
  score -= Math.min(matchedJi.length * 3, 8)

  score = clamp(Math.round(score), 5, 98)

  // 一票否决：日值月破等大凶煞，压低至凶档
  if (fatalSha.length > 0) score = Math.min(score, 22)

  const qiChang = buildQiChang({ tianShen, tianShenType, zhiXing, xiu, xiuLuck, fatalSha, score })

  return {
    dayGanZhi: lunar.getDayInGanZhi(),
    yi,
    ji,
    chongDesc: safeStr(() => lunar.getDayChongDesc()),
    sha: safeStr(() => lunar.getDaySha()),
    jiShen,
    xiongSha,
    xiu,
    xiuLuck,
    tianShen,
    tianShenType,
    zhiXing,
    animal: safeStr(() => lunar.getAnimal()),
    matchedYi,
    matchedJi,
    fatalSha,
    score,
    qiChang,
  }
}

function safeArr(fn: () => string[]): string[] {
  try {
    return fn() ?? []
  } catch {
    return []
  }
}

function safeStr(fn: () => string): string {
  try {
    return fn() ?? ''
  } catch {
    return ''
  }
}
