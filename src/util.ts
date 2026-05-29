export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** Date → 本地 YYYY-MM-DD 字符串 */
export function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** YYYY-MM-DD → Date（本地 0 点） */
export function fromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** YYYY-MM-DD → 「M月D日」 */
export function formatDate(ymd: string): string {
  const d = fromYmd(ymd)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
