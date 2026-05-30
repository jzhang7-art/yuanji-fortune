// 本地存储层。接口设计为 async，后续接入登录/后端时只需替换实现。
import type { BaZiInput } from '@/domain/bazi'
import type { HistoryRecord } from '@/types'
import { HISTORY_MAX } from '@/data/constants'
import { VIDEO_TYPES } from '@/data/videoTypes'
import { PLATFORMS } from '@/data/scoringConfig'

const BAZI_KEY = 'zmf:bazi'
const HISTORY_KEY = 'zmf:history'
const TRACKS_KEY = 'zmf:tracks'

export interface PreferredTracks {
  trackIds: string[] // 长度 1-3，须为 VIDEO_TYPES.id
  platform: string // 须为 PLATFORMS 之一
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 忽略写入失败（隐私模式等） */
  }
}

export async function saveBaZiInput(input: BaZiInput): Promise<void> {
  write(BAZI_KEY, input)
}

export async function loadBaZiInput(): Promise<BaZiInput | null> {
  return read<BaZiInput>(BAZI_KEY)
}

export async function loadHistory(): Promise<HistoryRecord[]> {
  return read<HistoryRecord[]>(HISTORY_KEY) ?? []
}

export async function saveHistory(record: HistoryRecord): Promise<void> {
  const list = await loadHistory()
  list.unshift(record)
  write(HISTORY_KEY, list.slice(0, HISTORY_MAX))
}

export async function clearHistory(): Promise<void> {
  write(HISTORY_KEY, [])
}

export async function loadPreferredTracks(): Promise<PreferredTracks | null> {
  const raw = read<unknown>(TRACKS_KEY)
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as { trackIds?: unknown; platform?: unknown }
  if (!Array.isArray(obj.trackIds) || typeof obj.platform !== 'string') return null
  const validIds = obj.trackIds.filter(
    (id): id is string => typeof id === 'string' && VIDEO_TYPES.some((v) => v.id === id),
  )
  if (validIds.length === 0) return null
  if (!(PLATFORMS as readonly string[]).includes(obj.platform)) return null
  return { trackIds: validIds.slice(0, 3), platform: obj.platform }
}

export async function savePreferredTracks(p: PreferredTracks): Promise<void> {
  const validIds = p.trackIds.filter((id) => VIDEO_TYPES.some((v) => v.id === id)).slice(0, 3)
  const validPlatform = (PLATFORMS as readonly string[]).includes(p.platform)
    ? p.platform
    : PLATFORMS[0]
  if (validIds.length === 0) return
  write(TRACKS_KEY, { trackIds: validIds, platform: validPlatform })
}

export async function clearPreferredTracks(): Promise<void> {
  try {
    localStorage.removeItem(TRACKS_KEY)
  } catch {
    /* 忽略 */
  }
}

const ALL_KEYS = ['zmf:bazi', 'zmf:history', 'zmf:publish', 'zmf:consent', 'zmf:tracks']

export async function eraseAllUserData(): Promise<void> {
  try {
    for (const k of ALL_KEYS) localStorage.removeItem(k)
    // PostHog 自有 key 前缀（ph_<token>_posthog / __ph_opt_in_out_<token> 等）— 一并清除以兑现「删除全部本地数据」承诺
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('ph_') || k.startsWith('__ph_')) localStorage.removeItem(k)
    }
  } catch {
    // 私密模式下可能抛错，吞掉即可
  }
}
