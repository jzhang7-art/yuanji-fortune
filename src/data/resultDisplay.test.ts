import { describe, expect, it } from 'vitest'
import { decisionAdvice, GRADE_TONE, VERDICT_HEADLINE } from './resultDisplay'
import type { Decision } from '@/domain/scoring'

const STUB_HOUR = { name: '午时', range: '11:00–13:00' }

function makeDecision(verdict: Decision['verdict'], opts: { betterDay?: { date: string; score: number } } = {}): Decision {
  return {
    verdict,
    grade: { tone: 'jade', label: '吉 · 顺势可发' },
    bestHour: STUB_HOUR,
    betterDay: opts.betterDay,
  } as unknown as Decision
}

describe('decisionAdvice', () => {
  it('go: 推荐当下时辰', () => {
    const text = decisionAdvice(makeDecision('go'))
    expect(text).toContain('午时')
    expect(text).toContain('11:00–13:00')
    expect(text).toContain('流量最旺')
  })

  it('hold 无 betterDay: 仅推荐当日时辰', () => {
    const text = decisionAdvice(makeDecision('hold'))
    expect(text).toContain('稳妥')
  })

  it('hold 有 betterDay: 提示更优日期', () => {
    const text = decisionAdvice(makeDecision('hold', { betterDay: { date: '2026-06-15', score: 78 } }))
    expect(text).toContain('78')
  })

  it('wait 有 betterDay: 推荐顺延', () => {
    const text = decisionAdvice(makeDecision('wait', { betterDay: { date: '2026-06-15', score: 82 } }))
    expect(text).toContain('顺延')
    expect(text).toContain('82')
  })

  it('wait 无 betterDay: 建议另择吉日', () => {
    const text = decisionAdvice(makeDecision('wait'))
    expect(text).toContain('另择')
  })
})

describe('GRADE_TONE / VERDICT_HEADLINE', () => {
  it('每个 verdict 都有对应文案', () => {
    expect(VERDICT_HEADLINE.go).toBeTruthy()
    expect(VERDICT_HEADLINE.hold).toBeTruthy()
    expect(VERDICT_HEADLINE.wait).toBeTruthy()
  })

  it('GRADE_TONE 包含所有评级 tone', () => {
    expect(GRADE_TONE.gold).toBeTruthy()
    expect(GRADE_TONE.jade).toBeTruthy()
    expect(GRADE_TONE.parchment).toBeTruthy()
    expect(GRADE_TONE.cinnabar).toBeTruthy()
  })
})
