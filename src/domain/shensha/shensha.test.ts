import { describe, expect, it } from 'vitest'
import { computeBaZi } from '@/domain/bazi'
import { detectShenSha } from '@/domain/shensha'

// 1990-05-15 未时 → 日柱庚辰（日干庚、日支辰）。详见 domain.test.ts 既有断言。
const chart = computeBaZi({ year: 1990, month: 5, day: 15, shiChenIndex: 7, gender: '男' })

describe('detectShenSha 神煞落时辰', () => {
  it('日干庚 → 天乙贵人在丑、未', () => {
    const names = (zhi: '丑' | '未' | '子') =>
      detectShenSha(chart, zhi).map((s) => s.name)
    expect(names('丑')).toContain('天乙贵人')
    expect(names('未')).toContain('天乙贵人')
    expect(names('子')).not.toContain('天乙贵人')
  })

  it('日支辰（申子辰局）→ 驿马在寅、桃花在酉', () => {
    expect(detectShenSha(chart, '寅').map((s) => s.name)).toContain('驿马')
    expect(detectShenSha(chart, '酉').map((s) => s.name)).toContain('桃花')
  })

  it('日干庚 → 文昌在亥', () => {
    expect(detectShenSha(chart, '亥').map((s) => s.name)).toContain('文昌')
  })

  it('每条神煞带 semantic 与正 bonus', () => {
    for (const s of detectShenSha(chart, '丑')) {
      expect(s.semantic).toBeTruthy()
      expect(s.bonus).toBeGreaterThan(0)
    }
  })
})
