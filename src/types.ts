import type { BaZiInput } from '@/domain/bazi'

export interface PublishInfo {
  videoTypeId: string
  title: string
  durationSec?: number
  platform: string
  targetDate: string // YYYY-MM-DD
}

export interface HistoryRecord {
  id: string
  createdAt: number
  baziInput: BaZiInput
  publishInfo: PublishInfo
  overallScore: number
}
