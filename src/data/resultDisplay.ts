import type { Decision } from '@/domain/scoring'
import { formatDate } from '@/util'

// scoreGrade() tone → ResultPage 强调色 token
export const GRADE_TONE: Record<string, string> = {
  gold: 'border-jin/50 bg-jin/15 text-jin-bright',
  jade: 'border-shilv/50 bg-shilv/15 text-shilv',
  parchment: 'border-qingmo/40 bg-qingmo/10 text-mibai',
  cinnabar: 'border-zhusha/50 bg-zhusha/20 text-zhusha-bright',
}

// scoreGrade() tone → ShareCard 主视觉用色（@theme 令牌 hex）
export const GRADE_COLOR: Record<string, string> = {
  gold: '#e6c878',
  jade: '#5a8a6a',
  parchment: '#e8ddc8',
  cinnabar: '#d4524a',
}

export const VERDICT_HEADLINE: Record<Decision['verdict'], string> = {
  go: '今日宜发布',
  hold: '今日运势中平',
  wait: '今日不宜发布',
}

export function decisionAdvice(d: Decision): string {
  const hour = `${d.bestHour.name}（${d.bestHour.range}）`
  if (d.verdict === 'go') {
    return `把握 ${hour}，为今日流量最旺的时段。`
  }
  if (d.verdict === 'hold') {
    return d.betterDay
      ? `若不赶时间，${formatDate(d.betterDay.date)} 发布指数更高（${d.betterDay.score}），更值得等；今日如要发，选 ${hour}。`
      : `今日如要发布，选 ${hour} 较为稳妥。`
  }
  return d.betterDay
    ? `建议顺延至 ${formatDate(d.betterDay.date)}（指数 ${d.betterDay.score}）；今日若必须发，择 ${hour} 并谨慎。`
    : `今日各时段运势均偏弱，建议另择吉日发布。`
}
