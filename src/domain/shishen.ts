// 时柱十神判定：由五行生克 + 阴阳同异定十神（纯函数，独立于 computeBaZi 旺衰核心）
import { GAN_WU_XING, GAN_YIN_YANG, type TianGan } from '@/data/ganzhi'
import { relation } from '@/domain/wuxing'

export type ShiShen =
  | '比肩' | '劫财'
  | '食神' | '伤官'
  | '偏财' | '正财'
  | '七杀' | '正官'
  | '偏印' | '正印'

/** 以日主 dayMaster 为基准，求天干 gan 的十神 */
export function shiShenOf(dayMaster: TianGan, gan: TianGan): ShiShen {
  const rel = relation(GAN_WU_XING[dayMaster], GAN_WU_XING[gan])
  const sameYinYang = GAN_YIN_YANG[dayMaster] === GAN_YIN_YANG[gan]
  switch (rel) {
    case '同我':
      return sameYinYang ? '比肩' : '劫财'
    case '我生':
      return sameYinYang ? '食神' : '伤官'
    case '我克':
      return sameYinYang ? '偏财' : '正财'
    case '克我':
      return sameYinYang ? '七杀' : '正官'
    case '生我':
      return sameYinYang ? '偏印' : '正印'
  }
}
