// 奇门排盘记忆化缓存：同一时空为纯函数，比测/日历会反复命中相同日期
import { computeQiMen, evaluateQiMen, type QiMenResult } from '@/domain/qimen'

const qimenCache = new Map<string, QiMenResult>()

/** 取（缓存的）某时辰奇门评估结果 */
export function getQiMen(y: number, m: number, d: number, h: number): QiMenResult {
  const key = `${y}-${m}-${d}-${h}`
  let r = qimenCache.get(key)
  if (!r) {
    r = evaluateQiMen(computeQiMen(y, m, d, h))
    qimenCache.set(key, r)
  }
  return r
}
