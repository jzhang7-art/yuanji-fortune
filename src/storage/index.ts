// 本地存储层。接口设计为 async，后续接入登录/后端时只需替换实现。
import type { BaZiInput } from '@/domain/bazi'
import type { HistoryRecord } from '@/types'
import { HISTORY_MAX } from '@/data/constants'

const BAZI_KEY = 'zmf:bazi'
const HISTORY_KEY = 'zmf:history'

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

const ALL_KEYS = ['zmf:bazi', 'zmf:history', 'zmf:publish', 'zmf:consent']

export async function eraseAllUserData(): Promise<void> {
  try {
    for (const k of ALL_KEYS) localStorage.removeItem(k)
  } catch {
    // 私密模式下可能抛错，吞掉即可
  }
}
