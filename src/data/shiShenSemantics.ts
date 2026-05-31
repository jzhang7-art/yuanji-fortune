// 十神 → 自媒体发布场景语义 + 语义基分（择时引擎"专业质感"来源）
import type { ShiShen } from '@/domain/shishen'

export interface ShiShenSemantic {
  category: '比劫' | '食伤' | '财' | '官杀' | '印'
  semantic: string
  base: number // 语义基分（叠加在 50 基准上）
}

export const SHI_SHEN_SEMANTICS: Record<ShiShen, ShiShenSemantic> = {
  伤官: { category: '食伤', semantic: '才华外放、吸睛表达，利出彩内容', base: 14 },
  食神: { category: '食伤', semantic: '亲和输出、稳定创作，利人设积累', base: 12 },
  正官: { category: '官杀', semantic: '专业权威、正规曝光', base: 9 },
  七杀: { category: '官杀', semantic: '爆发张力、话题争议性曝光', base: 8 },
  偏财: { category: '财', semantic: '泛流量受众、流量变现', base: 7 },
  正财: { category: '财', semantic: '务实转化、精准买单', base: 5 },
  正印: { category: '印', semantic: '知识口碑、贵人加持、深度积累', base: 5 },
  偏印: { category: '印', semantic: '冷门小众、玄学/技艺向', base: 2 },
  比肩: { category: '比劫', semantic: '自我表达，但易同质分流', base: 0 },
  劫财: { category: '比劫', semantic: '与人争流、易被分夺', base: -3 },
}
