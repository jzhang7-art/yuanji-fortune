# 时辰个人化择时引擎 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Codex 落地须知**：本计划面向 Codex 执行（见仓库 `AGENTS.md` 双 agent 协作约定：Codex 主力写代码/跑测试，Claude Code 负责架构/设计）。计划自包含——所有文件路径、接口签名、测试代码均已给全，无需回看对话上下文。源设计见 `docs/superpowers/specs/2026-05-31-personalized-hour-scoring-design.md`。

**Goal:** 让发布择时推荐按每个人的八字 + 当下奇门时局给出因人而异的时辰排名，根治"千篇一律"（永远午/戌/亥）。

**Architecture:** 两段式管线。第①段 `scoreHourFortune` 算纯命理时辰分（时柱十神 + 神煞 + 奇门日干用神 + 当下起局指向 + 日维基线），与流量无关；第②段 `applyTrafficWindow` 把平台流量当窗口惩罚因子叠加重排。所有改动不碰 `bazi` 旺衰核心、不碰 `qimen` 排盘（只读 palaces）。

**Tech Stack:** React 19 + TypeScript 5.7 + Vite 6 + vitest 3 + lunar-typescript。无新增依赖（纯 TS 算法）。

---

## 关键约定（每个 Task 都适用）

- **测试命令**：`npm test`（= `vitest run`）。AGENTS.md 要求改 `src/domain/` 前后必跑，27 个 domain 测试 + 共 76 个总测试须保持绿（本计划会重写其中 1 个、新增若干）。
- **类型检查**：`npx tsc --noEmit`。
- **import 别名**：项目用 `@/` 指向 `src/`（如 `@/domain/wuxing`）。
- **现成工具**（直接复用，勿重造）：
  - `clamp(n, min, max)` from `@/util`
  - `sheng(a,b)` / `ke(a,b)` / `relation(self,other)` / `WuXing` / `WU_XING` from `@/domain/wuxing`
  - `GAN_WU_XING` / `ZHI_WU_XING` / `GAN_YIN_YANG` / `TIAN_GAN` / `DI_ZHI` / `SHI_CHEN` / `jiaZiIndex` / `TianGan` / `DiZhi` from `@/data/ganzhi`
- **提交粒度**：每个 Task 末尾提交一次。当前分支 `feat/personalized-hour-scoring`。

---

## 文件结构总览

| 文件 | 性质 | 责任 | Task |
|---|---|---|---|
| `src/domain/shishen.ts` | 新 | `shiShenOf(dayMaster, gan)` 十神判定 | 1 |
| `src/data/shiShenSemantics.ts` | 新 | 十神 → 自媒体语义 + 基分表 | 2 |
| `src/domain/shensha/index.ts` | 新 | `detectShenSha(chart, hourZhi)` 神煞落时辰 | 3 |
| `src/domain/qimen/index.ts` | 扩展（只读 palaces） | `evaluateQiMenForDayMaster(chart, dayMaster)` | 4 |
| `src/data/scoringConfig.ts` | 改 | 命理四层权重 / 流量窗口阈值 / 拉伸增益 / 神煞封顶 | 5 |
| `src/domain/scoring/present.ts` | 新 | `buildPresentDivination(now)` 当下起局（B-指向 + B-基调） | 6 |
| `src/domain/scoring/hourFortune.ts` | 新（第①段） | `scoreHourFortune(...)` 纯命理时辰分聚合 | 7 |
| `src/domain/scoring/trafficWindow.ts` | 新（第②段） | `applyTrafficWindow(fortunes, platform)` | 8 |
| `src/domain/scoring/index.ts` | 改 | `scoreDay`/`computeForecast`/`computeDailyFortune`/`computeCalendar`/`computeSchedule` 改用两段管线 + `now` 注入 | 9 |
| `src/domain/scoring/scoring.personalization.test.ts` | 新 | 核心回归断言 T1–T7 | 9 |
| `src/domain/domain.test.ts` | 改 | 重写 1 个旧测试（:183-196） | 9 |
| UI（最小接入）+ 验证 | — | 截图走查 + 典籍核验 + 基线 | 10 |

---

## Task 1: 时柱十神判定 `shiShenOf`

**Files:**
- Create: `src/domain/shishen.ts`
- Test: `src/domain/shishen.test.ts`

- [ ] **Step 1: 写失败测试**

`src/domain/shishen.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { shiShenOf } from '@/domain/shishen'

describe('shiShenOf 十神判定', () => {
  // 以日主甲（木·阳）为基准，遍历十干，覆盖五类关系 × 阴阳同异
  it('甲日主十神真值表 10 条', () => {
    expect(shiShenOf('甲', '甲')).toBe('比肩') // 同我·同阳
    expect(shiShenOf('甲', '乙')).toBe('劫财') // 同我·异
    expect(shiShenOf('甲', '丙')).toBe('食神') // 我生·同阳
    expect(shiShenOf('甲', '丁')).toBe('伤官') // 我生·异
    expect(shiShenOf('甲', '戊')).toBe('偏财') // 我克·同阳
    expect(shiShenOf('甲', '己')).toBe('正财') // 我克·异
    expect(shiShenOf('甲', '庚')).toBe('七杀') // 克我·同阳
    expect(shiShenOf('甲', '辛')).toBe('正官') // 克我·异
    expect(shiShenOf('甲', '壬')).toBe('偏印') // 生我·同阳
    expect(shiShenOf('甲', '癸')).toBe('正印') // 生我·异
  })

  it('阴日主 同阴阳判定正确（乙见乙=比肩，乙见甲=劫财）', () => {
    expect(shiShenOf('乙', '乙')).toBe('比肩')
    expect(shiShenOf('乙', '甲')).toBe('劫财')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- shishen`
Expected: FAIL（`shiShenOf` 未定义 / 模块不存在）

- [ ] **Step 3: 写最小实现**

`src/domain/shishen.ts`：

```ts
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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- shishen`
Expected: PASS（2 个测试）

- [ ] **Step 5: 提交**

```bash
git add src/domain/shishen.ts src/domain/shishen.test.ts
git commit -m "feat(scoring): 时柱十神判定 shiShenOf + 真值表测试"
```

---

## Task 2: 十神自媒体语义表

**Files:**
- Create: `src/data/shiShenSemantics.ts`
- Test: `src/data/shiShenSemantics.test.ts`

- [ ] **Step 1: 写失败测试**

`src/data/shiShenSemantics.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { SHI_SHEN_SEMANTICS } from '@/data/shiShenSemantics'
import type { ShiShen } from '@/domain/shishen'

const ALL: ShiShen[] = [
  '比肩', '劫财', '食神', '伤官', '偏财',
  '正财', '七杀', '正官', '偏印', '正印',
]

describe('十神语义表', () => {
  it('十神全覆盖，字段完整', () => {
    for (const ss of ALL) {
      const e = SHI_SHEN_SEMANTICS[ss]
      expect(e).toBeTruthy()
      expect(e.category).toBeTruthy()
      expect(e.semantic).toBeTruthy()
      expect(typeof e.base).toBe('number')
    }
  })

  it('伤官基分最高、劫财为负（自媒体场景排序）', () => {
    expect(SHI_SHEN_SEMANTICS['伤官'].base).toBe(14)
    expect(SHI_SHEN_SEMANTICS['食神'].base).toBe(12)
    expect(SHI_SHEN_SEMANTICS['劫财'].base).toBe(-3)
    expect(SHI_SHEN_SEMANTICS['伤官'].base).toBeGreaterThan(
      SHI_SHEN_SEMANTICS['正财'].base,
    )
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- shiShenSemantics`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写实现**

`src/data/shiShenSemantics.ts`：

```ts
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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- shiShenSemantics`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/data/shiShenSemantics.ts src/data/shiShenSemantics.test.ts
git commit -m "feat(scoring): 十神自媒体语义 + 基分表"
```

---

## Task 3: 神煞落时辰 `detectShenSha`

**Files:**
- Create: `src/domain/shensha/index.ts`
- Test: `src/domain/shensha/shensha.test.ts`

> **典籍核验**：本 Task 的四张查表（天乙贵人/驿马/桃花/文昌）为标准命理表。落地后请 Claude Code 派"典籍考据员"只读核验一遍（单手做，不并行改码）。表值若需订正，仅改本文件常量。

- [ ] **Step 1: 写失败测试**

`src/domain/shensha/shensha.test.ts`：

```ts
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- shensha`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写实现**

`src/domain/shensha/index.ts`：

```ts
// 神煞落时辰：按命主日干/日支查，命中落在给定时支的神煞（个人化择时信号）
import type { BaZiChart } from '@/domain/bazi'
import type { DiZhi, TianGan } from '@/data/ganzhi'

export interface ShenSha {
  name: string
  semantic: string
  bonus: number
}

// 天乙贵人（按日干 → 命中两地支）：甲戊庚丑未 / 乙己子申 / 丙丁亥酉 / 壬癸卯巳 / 辛寅午
const TIAN_YI: Record<TianGan, DiZhi[]> = {
  甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
  乙: ['子', '申'], 己: ['子', '申'],
  丙: ['亥', '酉'], 丁: ['亥', '酉'],
  壬: ['卯', '巳'], 癸: ['卯', '巳'],
  辛: ['寅', '午'],
}

// 文昌（按日干 → 命中一地支）
const WEN_CHANG: Record<TianGan, DiZhi> = {
  甲: '巳', 乙: '午', 丙: '申', 戊: '申', 丁: '酉', 己: '酉',
  庚: '亥', 辛: '子', 壬: '寅', 癸: '卯',
}

// 三合局归属：每个地支属于哪一个三合局（用于查驿马/桃花/将星）
const SAN_HE_GROUP: Record<DiZhi, '申子辰' | '寅午戌' | '巳酉丑' | '亥卯未'> = {
  申: '申子辰', 子: '申子辰', 辰: '申子辰',
  寅: '寅午戌', 午: '寅午戌', 戌: '寅午戌',
  巳: '巳酉丑', 酉: '巳酉丑', 丑: '巳酉丑',
  亥: '亥卯未', 卯: '亥卯未', 未: '亥卯未',
}

// 驿马（按日支三合局 → 命中地支）
const YI_MA: Record<string, DiZhi> = {
  申子辰: '寅', 寅午戌: '申', 巳酉丑: '亥', 亥卯未: '巳',
}

// 桃花/咸池（按日支三合局 → 命中地支）
const TAO_HUA: Record<string, DiZhi> = {
  申子辰: '酉', 寅午戌: '卯', 巳酉丑: '午', 亥卯未: '子',
}

// 将星（按日支三合局中神 → 命中地支）
const JIANG_XING: Record<string, DiZhi> = {
  申子辰: '子', 寅午戌: '午', 巳酉丑: '酉', 亥卯未: '卯',
}

/** 给定命盘与某时支，返回落在该时支的神煞列表 */
export function detectShenSha(chart: BaZiChart, hourZhi: DiZhi): ShenSha[] {
  const out: ShenSha[] = []
  const dayGan = chart.day.gan
  const dayZhi = chart.day.zhi
  const group = SAN_HE_GROUP[dayZhi]

  if (TIAN_YI[dayGan]?.includes(hourZhi)) {
    out.push({ name: '天乙贵人', semantic: '贵人相助，易得推流加持', bonus: 8 })
  }
  if (YI_MA[group] === hourZhi) {
    out.push({ name: '驿马', semantic: '流动扩散，内容易跑出圈', bonus: 6 })
  }
  if (TAO_HUA[group] === hourZhi) {
    out.push({ name: '桃花', semantic: '吸引力强，利吸粉涨粉', bonus: 6 })
  }
  if (WEN_CHANG[dayGan] === hourZhi) {
    out.push({ name: '文昌', semantic: '文思才华，利内容质量', bonus: 5 })
  }
  if (JIANG_XING[group] === hourZhi) {
    out.push({ name: '将星', semantic: '统御力强，利权威曝光', bonus: 4 })
  }
  return out
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- shensha`
Expected: PASS

> 自检：日干庚 → 天乙在丑未 ✓、文昌在亥 ✓；日支辰属申子辰 → 驿马寅 ✓、桃花酉 ✓。

- [ ] **Step 5: 提交**

```bash
git add src/domain/shensha/index.ts src/domain/shensha/shensha.test.ts
git commit -m "feat(scoring): 神煞落时辰 detectShenSha（天乙/驿马/桃花/文昌/将星）"
```

---

## Task 4: 奇门日干用神 `evaluateQiMenForDayMaster`

**Files:**
- Modify: `src/domain/qimen/index.ts`（**仅新增导出函数，不改 `computeQiMen` 排盘**）
- Test: `src/domain/qimen/qimen-daymaster.test.ts`

> 红线：`computeQiMen` 与张志春两案例校验（`domain.test.ts:104-135`）不得改动。新函数只读 `chart.palaces`。

- [ ] **Step 1: 写失败测试**

`src/domain/qimen/qimen-daymaster.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { computeQiMen, evaluateQiMenForDayMaster } from '@/domain/qimen'

describe('evaluateQiMenForDayMaster 奇门日干用神', () => {
  const chart = computeQiMen(1995, 6, 11, 6) // 张志春例一：阳遁三局

  it('非甲日干：定位日干地盘宫，返回 0–100 质量', () => {
    const r = evaluateQiMenForDayMaster(chart, '戊')
    expect(r.dayMasterPalace).toBeGreaterThanOrEqual(1)
    expect(r.dayMasterPalace).toBeLessThanOrEqual(9)
    expect(r.quality).toBeGreaterThanOrEqual(0)
    expect(r.quality).toBeLessThanOrEqual(100)
    expect(r.note).toBeTruthy()
    // 例一 palaces[3].earthGan === '戊'，戊落 3 宫
    expect(r.dayMasterPalace).toBe(3)
  })

  it('甲日干：走旬首六仪宫 fallback，不抛错且落点有效', () => {
    const r = evaluateQiMenForDayMaster(chart, '甲')
    expect(r.dayMasterPalace).toBeGreaterThanOrEqual(1)
    expect(r.dayMasterPalace).toBeLessThanOrEqual(9)
    expect(r.quality).toBeGreaterThanOrEqual(0)
  })

  it('只读：调用前后 chart 不变', () => {
    const before = JSON.stringify(chart)
    evaluateQiMenForDayMaster(chart, '庚')
    expect(JSON.stringify(chart)).toBe(before)
  })

  it('不同日干同一局：质量可不同（个人化）', () => {
    const a = evaluateQiMenForDayMaster(chart, '戊').quality
    const b = evaluateQiMenForDayMaster(chart, '丙').quality
    expect(typeof a).toBe('number')
    expect(typeof b).toBe('number')
    // 戊落3宫、丙落他宫，落点不同 → 质量大概率不同（至少落宫不同）
    expect(evaluateQiMenForDayMaster(chart, '戊').dayMasterPalace).not.toBe(
      evaluateQiMenForDayMaster(chart, '丙').dayMasterPalace,
    )
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- qimen-daymaster`
Expected: FAIL（`evaluateQiMenForDayMaster` 未导出）

- [ ] **Step 3: 写实现（追加到 `src/domain/qimen/index.ts` 末尾）**

文件顶部已 `import { jiaZiIndex, SHI_CHEN } from '@/data/ganzhi'`、`import { ke, sheng } from '@/domain/wuxing'`、`import { ... XUN_SHOU_YI } from '@/domain/qimen/tables'`、`import { clamp } from '@/util'`、`PALACE_META`。`palaceQuality` 为本文件内私有函数，可直接调用。在文件末尾追加：

```ts
export interface DayMasterQiMen {
  dayMasterPalace: number
  quality: number // 0–100
  note: string
}

/**
 * 奇门日干用神：取日干地盘落宫为用神宫，评估其质量 + 与三用神门（景/生/开）宫的生克。
 * 日干=甲遁旬首六仪（按日干支所在旬），其余日干直接在地盘定位。只读 chart.palaces。
 */
export function evaluateQiMenForDayMaster(
  chart: QiMenChart,
  dayMaster: string,
): DayMasterQiMen {
  // 1. 定位日干落宫
  let targetGan = dayMaster
  if (dayMaster === '甲') {
    // 甲遁旬首：按日干支求旬首六仪
    const dayIdx = jiaZiIndex(chart.dayGanZhi)
    const xun = dayIdx >= 0 ? Math.floor(dayIdx / 10) : 0
    targetGan = XUN_SHOU_YI[xun]
  }
  let dmPalace = 5
  for (let p = 1; p <= 9; p++) {
    if (chart.palaces[p].earthGan === targetGan) {
      dmPalace = p
      break
    }
  }
  const ps = chart.palaces[dmPalace]
  const baseQuality = palaceQuality(ps)

  // 2. 与三用神门宫的生克（日干宫 vs 门宫五行）
  const dmElement = ps.element
  let rel = 0
  for (const door of ['景门', '生门', '开门']) {
    const dp = findDoorPalace(chart, door)
    const de = dp.element
    if (sheng(dmElement, de)) rel += 4 // 宫生门：气贯传播
    else if (de === dmElement) rel += 2 // 比和
    else if (ke(de, dmElement)) rel -= 4 // 门克宫：受制
    else if (ke(dmElement, de)) rel -= 2 // 宫克门：耗气
  }

  const quality = clamp(Math.round(baseQuality + rel), 0, 100)
  const note = `日干${dayMaster}落${PALACE_META[dmPalace].trigram}宫（${PALACE_META[dmPalace].direction}），用神门${rel >= 0 ? '得气' : '受制'}`
  return { dayMasterPalace: dmPalace, quality, note }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- qimen-daymaster`
Expected: PASS

- [ ] **Step 5: 跑全量确认排盘红线未破**

Run: `npm test -- domain`
Expected: PASS（奇门张志春两案例仍绿）

- [ ] **Step 6: 提交**

```bash
git add src/domain/qimen/index.ts src/domain/qimen/qimen-daymaster.test.ts
git commit -m "feat(scoring): 奇门日干用神 evaluateQiMenForDayMaster（只读 palaces）"
```

---

## Task 5: 评分配置扩展

**Files:**
- Modify: `src/data/scoringConfig.ts`（在文件末尾追加常量）
- Test: `src/data/scoringConfig.test.ts`

- [ ] **Step 1: 写失败测试**

`src/data/scoringConfig.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import {
  FORTUNE_WEIGHTS,
  FORTUNE_STRETCH_GAIN,
  SHENSHA_BONUS_CAP,
  TRAFFIC_ACTIVE_THRESHOLD,
  TRAFFIC_FACTOR_FLOOR,
  TRAFFIC_LOW_THRESHOLD,
} from '@/data/scoringConfig'

describe('命理评分配置', () => {
  it('命理四层 + 日维基线权重和为 1', () => {
    const sum =
      FORTUNE_WEIGHTS.shiShen +
      FORTUNE_WEIGHTS.shenSha +
      FORTUNE_WEIGHTS.qimenDayMaster +
      FORTUNE_WEIGHTS.qimenPresentAim +
      FORTUNE_WEIGHTS.dayBaseline
    expect(sum).toBeCloseTo(1, 5)
  })

  it('阈值取值合理', () => {
    expect(FORTUNE_STRETCH_GAIN).toBeGreaterThan(1)
    expect(SHENSHA_BONUS_CAP).toBeGreaterThan(0)
    expect(TRAFFIC_FACTOR_FLOOR).toBeGreaterThan(0)
    expect(TRAFFIC_FACTOR_FLOOR).toBeLessThan(1)
    expect(TRAFFIC_LOW_THRESHOLD).toBeLessThan(TRAFFIC_ACTIVE_THRESHOLD)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- scoringConfig`
Expected: FAIL（常量未定义）

- [ ] **Step 3: 写实现（追加到 `src/data/scoringConfig.ts` 末尾）**

```ts
// —— 时辰个人化命理引擎配置 ——

// 命理四层 + 日维基线权重（和为 1），用于合成 fortuneScore
export const FORTUNE_WEIGHTS = {
  shiShen: 0.38, // 时柱十神（含喜忌调节）
  shenSha: 0.12, // 神煞落时辰
  qimenDayMaster: 0.18, // 奇门·候选时辰日干用神
  qimenPresentAim: 0.12, // 奇门·当下局指向
  dayBaseline: 0.2, // 日维基线（八字日支 + 黄历 + 视频契合）
} as const

// 区分度拉伸增益：stretched = 50 + (raw - 50) * GAIN
export const FORTUNE_STRETCH_GAIN = 1.4

// 神煞 bonus 求和封顶
export const SHENSHA_BONUS_CAP = 18

// 流量窗口：>= 活跃阈值 命理全权决定；以下按比例降权到地板
export const TRAFFIC_ACTIVE_THRESHOLD = 50
export const TRAFFIC_FACTOR_FLOOR = 0.55
// 低于此流量标注「流量低谷」
export const TRAFFIC_LOW_THRESHOLD = 40
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- scoringConfig`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/data/scoringConfig.ts src/data/scoringConfig.test.ts
git commit -m "feat(scoring): 新增命理四层权重 / 流量窗口 / 拉伸增益配置"
```

---

## Task 6: 当下问事起局 `buildPresentDivination`

**Files:**
- Create: `src/domain/scoring/present.ts`
- Test: `src/domain/scoring/present.test.ts`

> B-指向纯由 `evaluateQiMen` 的公开 `highlights`（每个用神门的落宫 + quality）派生，无需访问 qimen 私有函数。

- [ ] **Step 1: 写失败测试**

`src/domain/scoring/present.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { buildPresentDivination } from '@/domain/scoring/present'

describe('buildPresentDivination 当下起局', () => {
  const now = new Date('2026-05-18T12:30:00') // 固定时刻 → 确定

  it('结构完整：aimBoostByHour 长 12，toneShift 有限，headline 非空', () => {
    const p = buildPresentDivination(now)
    expect(p.aimBoostByHour).toHaveLength(12)
    expect(Number.isFinite(p.toneShift)).toBe(true)
    expect(Math.abs(p.toneShift)).toBeLessThanOrEqual(10)
    expect(p.headline).toBeTruthy()
    expect(p.toneScore).toBeGreaterThanOrEqual(0)
    expect(p.toneScore).toBeLessThanOrEqual(100)
  })

  it('确定性：同一 now 两次构建结果一致', () => {
    const a = buildPresentDivination(now)
    const b = buildPresentDivination(now)
    expect(a.aimBoostByHour).toEqual(b.aimBoostByHour)
    expect(a.toneShift).toBe(b.toneShift)
  })

  it('当下局随时刻而动：不同 now 可得不同 aim 或 tone', () => {
    const a = buildPresentDivination(new Date('2026-05-18T12:30:00'))
    const b = buildPresentDivination(new Date('2026-08-20T03:30:00'))
    const differ =
      JSON.stringify(a.aimBoostByHour) !== JSON.stringify(b.aimBoostByHour) ||
      a.toneScore !== b.toneScore
    expect(differ).toBe(true)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- present`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写实现**

`src/domain/scoring/present.ts`：

```ts
// 当下问事起局（B）：用户测算那一刻起一局，得「指向时辰」boost + 整体基调修正
import { computeQiMen, evaluateQiMen, type QiMenChart } from '@/domain/qimen'
import { clamp } from '@/util'

export interface PresentDivination {
  chart: QiMenChart
  toneScore: number // 当下局整体吉凶 0–100
  toneShift: number // 整体水位修正（叠加到 overall）
  headline: string // 一句占断文案
  aimBoostByHour: number[] // 长 12，B-指向对各时辰的 boost
}

// 九宫 → 对应时辰（SHI_CHEN index）。中 5 宫无对应时辰。
const PALACE_TO_SHICHEN: Record<number, number[]> = {
  1: [0], // 坎·子
  8: [1, 2], // 艮·丑寅
  3: [3], // 震·卯
  4: [4, 5], // 巽·辰巳
  9: [6], // 离·午
  2: [7, 8], // 坤·未申
  7: [9], // 兑·酉
  6: [10, 11], // 乾·戌亥
}

// 用神门权重（与 evaluateQiMen 内部一致）
const DOOR_WEIGHT: Record<string, number> = { 景门: 0.4, 生门: 0.35, 开门: 0.25 }

/** 由 Date 求时辰序号（子时含 23:00–01:00） */
function shiChenIndexOf(now: Date): number {
  return Math.floor(((now.getHours() + 1) % 24) / 2)
}

/** 起当下局并派生 B-指向 / B-基调 */
export function buildPresentDivination(now: Date): PresentDivination {
  const idx = shiChenIndexOf(now)
  const chart = computeQiMen(now.getFullYear(), now.getMonth() + 1, now.getDate(), idx)
  const evalRes = evaluateQiMen(chart)

  const toneScore = evalRes.score
  const toneShift = Math.round((toneScore - 50) * 0.15) // ±7~8 区间

  const aimBoostByHour = new Array(12).fill(0)
  for (const h of evalRes.highlights) {
    const w = DOOR_WEIGHT[h.door] ?? 0
    const hours = PALACE_TO_SHICHEN[h.palace] ?? []
    const boost = clamp(h.quality - 50, -20, 20) * w
    for (const hourIdx of hours) aimBoostByHour[hourIdx] += boost
  }

  let headline: string
  if (toneScore >= 70) headline = '当下起局，用神得用，此刻谋发布吉，宜顺势而为。'
  else if (toneScore >= 50) headline = '当下起局，时局平稳，发布无大碍，择吉时而动。'
  else headline = '当下起局，用神受制，此刻宜缓，可另择良辰或先打磨内容。'

  return { chart, toneScore, toneShift, headline, aimBoostByHour }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- present`
Expected: PASS

> 若"不同 now 可得不同"偶发性相等导致 flaky，本测试已选取跨季节 + 跨时辰的两个时刻（局数/用神落宫几乎必不同），稳定通过。

- [ ] **Step 5: 提交**

```bash
git add src/domain/scoring/present.ts src/domain/scoring/present.test.ts
git commit -m "feat(scoring): 当下问事起局 buildPresentDivination（B-指向 + B-基调）"
```

---

## Task 7: 纯命理时辰分 `scoreHourFortune`（第①段）

**Files:**
- Create: `src/domain/scoring/hourFortune.ts`
- Test: `src/domain/scoring/hourFortune.test.ts`

- [ ] **Step 1: 写失败测试**

`src/domain/scoring/hourFortune.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { computeBaZi } from '@/domain/bazi'
import { buildPresentDivination } from '@/domain/scoring/present'
import { scoreHourFortune, type DayContext } from '@/domain/scoring/hourFortune'

const present = buildPresentDivination(new Date('2026-05-18T12:30:00'))
// 注意：scoreHourFortune 不收 video 参（视频契合已折进 ctx.dayBaselineScore），故此处无需 video

// 1990-05-15 庚辰日主 vs 1992-03-20 命主
const chartA = computeBaZi({ year: 1990, month: 5, day: 15, shiChenIndex: 7, gender: '男' })
const chartB = computeBaZi({ year: 1992, month: 3, day: 20, shiChenIndex: 5, gender: '男' })

const ctx: DayContext = { dayGanZhi: '甲子', dayBaselineScore: 55 }

describe('scoreHourFortune 纯命理时辰分', () => {
  it('返回完整结构，fortuneScore 在 0–100', () => {
    const f = scoreHourFortune(chartA, 2026, 5, 18, 6, ctx, present)
    expect(f.shiChenIndex).toBe(6)
    expect(f.hourGanZhi).toHaveLength(2)
    expect(f.shiShen.name).toBeTruthy()
    expect(Array.isArray(f.shenSha)).toBe(true)
    expect(f.qimenDayMaster.quality).toBeGreaterThanOrEqual(0)
    expect(f.fortuneScore).toBeGreaterThanOrEqual(0)
    expect(f.fortuneScore).toBeLessThanOrEqual(100)
    expect(f.reasons.length).toBeGreaterThan(0)
    // 向后兼容字段
    expect(f.qimen).toBeTruthy()
    expect(typeof f.qimenScore).toBe('number')
  })

  it('个人化：两个不同八字同一时辰，十神与分数可不同', () => {
    const fa = scoreHourFortune(chartA, 2026, 5, 18, 6, ctx, present)
    const fb = scoreHourFortune(chartB, 2026, 5, 18, 6, ctx, present)
    // 日主不同 → 同一时干的十神不同
    const differ =
      fa.shiShen.name !== fb.shiShen.name || fa.fortuneScore !== fb.fortuneScore
    expect(differ).toBe(true)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- hourFortune`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写实现**

`src/domain/scoring/hourFortune.ts`：

```ts
// 第①段：纯命理时辰分（时柱十神 + 神煞 + 奇门日干用神 + 当下局指向 + 日维基线）
// 与平台流量、与"谁在看"无关。
import type { BaZiChart } from '@/domain/bazi'
import { getQiMen } from '@/domain/scoring'
import { evaluateQiMenForDayMaster } from '@/domain/qimen'
import type { QiMenResult } from '@/domain/qimen'
import { shiShenOf } from '@/domain/shishen'
import { SHI_SHEN_SEMANTICS } from '@/data/shiShenSemantics'
import { detectShenSha, type ShenSha } from '@/domain/shensha'
import { GAN_WU_XING, ZHI_WU_XING, SHI_CHEN } from '@/data/ganzhi'
import type { DiZhi, TianGan } from '@/data/ganzhi'
import {
  FORTUNE_WEIGHTS,
  FORTUNE_STRETCH_GAIN,
  SHENSHA_BONUS_CAP,
} from '@/data/scoringConfig'
import type { PresentDivination } from '@/domain/scoring/present'
import { clamp } from '@/util'

export interface DayContext {
  dayGanZhi: string
  dayBaselineScore: number // 0–100，全天恒定（八字日支 + 黄历 + 视频契合）
}

export interface HourFortune {
  shiChenIndex: number
  name: string
  range: string
  hourGanZhi: string
  shiShen: { gan: string; name: string; category: string; semantic: string; score: number }
  shenSha: ShenSha[]
  qimenDayMaster: { palace: number; quality: number; note: string }
  fortuneScore: number // 纯命理 0–100（已拉伸，已含 B-指向）
  reasons: string[]
  // —— 向后兼容现有 HourScore ——
  qimen: QiMenResult // 候选时辰通用奇门（供 UI summary/highlights）
  qimenScore: number // = qimen.score
}

/** 时柱五行 vs 命主喜忌（仿 baziDayScore，作用于时柱干支） */
function favorModifier(chart: BaZiChart, hourGan: TianGan, hourZhi: DiZhi): number {
  let mod = 0
  for (const e of [GAN_WU_XING[hourGan], ZHI_WU_XING[hourZhi]]) {
    if (e === chart.primaryFavorable) mod += 12
    else if (chart.favorable.includes(e)) mod += 7
    else mod -= 9
  }
  return mod
}

export function scoreHourFortune(
  chart: BaZiChart,
  y: number,
  m: number,
  d: number,
  shiChenIndex: number,
  ctx: DayContext,
  present: PresentDivination,
): HourFortune {
  const sc = SHI_CHEN[shiChenIndex]
  const qm = getQiMen(y, m, d, shiChenIndex) // QiMenResult（有 .chart / .score）
  const hourGanZhi = qm.chart.hourGanZhi
  const hourGan = hourGanZhi.charAt(0) as TianGan
  const hourZhi = hourGanZhi.charAt(1) as DiZhi

  // 第 1 层：时柱十神（语义基分 + 喜忌调节）
  const ssName = shiShenOf(chart.dayMaster, hourGan)
  const sem = SHI_SHEN_SEMANTICS[ssName]
  const shiShenScore = clamp(50 + sem.base + favorModifier(chart, hourGan, hourZhi), 5, 95)

  // 第 2 层：神煞
  const shenSha = detectShenSha(chart, hourZhi)
  const shenShaBonus = Math.min(
    shenSha.reduce((a, s) => a + s.bonus, 0),
    SHENSHA_BONUS_CAP,
  )
  const shenShaScore = clamp(50 + shenShaBonus, 0, 100)

  // 第 3 层：奇门日干用神（A）
  const dm = evaluateQiMenForDayMaster(qm.chart, chart.dayMaster)

  // 第 4 层：当下局指向（B-指向）
  const aimScore = clamp(50 + present.aimBoostByHour[shiChenIndex], 0, 100)

  // 聚合 → 拉伸
  const raw =
    shiShenScore * FORTUNE_WEIGHTS.shiShen +
    shenShaScore * FORTUNE_WEIGHTS.shenSha +
    dm.quality * FORTUNE_WEIGHTS.qimenDayMaster +
    aimScore * FORTUNE_WEIGHTS.qimenPresentAim +
    ctx.dayBaselineScore * FORTUNE_WEIGHTS.dayBaseline
  const fortuneScore = clamp(Math.round(50 + (raw - 50) * FORTUNE_STRETCH_GAIN), 0, 100)

  // 解释文案
  const reasons: string[] = [`时柱${hourGanZhi}为${ssName}，${sem.semantic}`]
  for (const s of shenSha) reasons.push(`${s.name}临，${s.semantic}`)
  reasons.push(dm.note)
  if (present.aimBoostByHour[shiChenIndex] > 0) {
    reasons.push('当下起局用神指向此时辰，传播得助力')
  }

  return {
    shiChenIndex,
    name: sc.name,
    range: sc.range,
    hourGanZhi,
    shiShen: {
      gan: hourGan,
      name: ssName,
      category: sem.category,
      semantic: sem.semantic,
      score: shiShenScore,
    },
    shenSha,
    qimenDayMaster: { palace: dm.dayMasterPalace, quality: dm.quality, note: dm.note },
    fortuneScore,
    reasons,
    qimen: qm,
    qimenScore: qm.score,
  }
}
```

> 注意：`getQiMen` 从 `@/domain/scoring`（即 `scoring/index.ts`）导入——它已存在且导出（带记忆化缓存）。`hourFortune.ts` 依赖 `scoring/index.ts`，而 Task 9 中 `scoring/index.ts` 又会 import `scoreHourFortune`，形成模块循环。两者只在**函数调用时**互相引用（非模块顶层求值），ES module 可正常处理此类循环。若 Codex 遇到循环求值告警，可将 `getQiMen` 连同 `qimenCache` 抽到独立文件 `src/domain/scoring/qimenCache.ts`，两边都从它 import（推荐做法，见 Task 9 Step 0）。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- hourFortune`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/domain/scoring/hourFortune.ts src/domain/scoring/hourFortune.test.ts
git commit -m "feat(scoring): 纯命理时辰分 scoreHourFortune（第①段聚合）"
```

---

## Task 8: 流量窗口层 `applyTrafficWindow`（第②段）

**Files:**
- Create: `src/domain/scoring/trafficWindow.ts`
- Test: `src/domain/scoring/trafficWindow.test.ts`

- [ ] **Step 1: 写失败测试**

`src/domain/scoring/trafficWindow.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { computeBaZi } from '@/domain/bazi'
import { buildPresentDivination } from '@/domain/scoring/present'
import { scoreHourFortune, type DayContext } from '@/domain/scoring/hourFortune'
import { applyTrafficWindow } from '@/domain/scoring/trafficWindow'
import { SHI_CHEN } from '@/data/ganzhi'

const present = buildPresentDivination(new Date('2026-05-18T12:30:00'))
const chart = computeBaZi({ year: 1992, month: 3, day: 20, shiChenIndex: 5, gender: '男' })
const ctx: DayContext = { dayGanZhi: '甲子', dayBaselineScore: 55 }
const fortunes = SHI_CHEN.map((sc) =>
  scoreHourFortune(chart, 2026, 5, 18, sc.index, ctx, present),
)

describe('applyTrafficWindow 流量窗口', () => {
  it('保留命理分，叠加流量字段；score = finalScore', () => {
    const ranked = applyTrafficWindow(fortunes, '抖音')
    expect(ranked).toHaveLength(12)
    for (const r of ranked) {
      expect(r.fortuneScore).toBe(fortunes[r.shiChenIndex].fortuneScore)
      expect(r.finalScore).toBe(r.score)
      expect(r.trafficFactor).toBeGreaterThanOrEqual(0.55)
      expect(r.trafficFactor).toBeLessThanOrEqual(1)
    }
  })

  it('凌晨低流量时辰被降权但 finalScore > 0 且标注 lowTraffic', () => {
    const ranked = applyTrafficWindow(fortunes, '抖音')
    const yin = ranked.find((r) => r.shiChenIndex === 2)! // 寅时 03–05
    expect(yin.trafficFactor).toBeLessThan(1)
    expect(yin.finalScore).toBeGreaterThan(0)
    expect(yin.lowTraffic).toBe(true)
  })

  it('活跃窗口内时辰 factor = 1，流量不改命理相对序', () => {
    const ranked = applyTrafficWindow(fortunes, '抖音')
    // 午(6)/戌(10)/亥(11) 均为活跃时辰 → factor 1
    for (const idx of [6, 10, 11]) {
      expect(ranked.find((r) => r.shiChenIndex === idx)!.trafficFactor).toBe(1)
    }
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- trafficWindow`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写实现**

`src/domain/scoring/trafficWindow.ts`：

```ts
// 第②段：流量窗口惩罚 + 标注。流量不进命理分，只做末端重排。
import type { HourFortune } from '@/domain/scoring/hourFortune'
import {
  getPlatformProfile,
  PLATFORM_PEAK_THRESHOLD,
  TRAFFIC_ACTIVE_THRESHOLD,
  TRAFFIC_FACTOR_FLOOR,
  TRAFFIC_LOW_THRESHOLD,
} from '@/data/scoringConfig'
import { clamp } from '@/util'

export interface RankedHour extends HourFortune {
  trafficScore: number
  trafficFactor: number
  finalScore: number
  platformPeak: boolean
  lowTraffic: boolean
  // —— 向后兼容现有 HourScore：score = finalScore ——
  score: number
}

export function applyTrafficWindow(
  fortunes: HourFortune[],
  platform: string,
): RankedHour[] {
  const profile = getPlatformProfile(platform)
  return fortunes.map((f) => {
    const trafficScore = profile.hourScores[f.shiChenIndex] ?? 50
    const trafficFactor =
      trafficScore >= TRAFFIC_ACTIVE_THRESHOLD
        ? 1
        : TRAFFIC_FACTOR_FLOOR +
          (1 - TRAFFIC_FACTOR_FLOOR) * (trafficScore / TRAFFIC_ACTIVE_THRESHOLD)
    const finalScore = clamp(Math.round(f.fortuneScore * trafficFactor), 0, 100)
    return {
      ...f,
      trafficScore,
      trafficFactor,
      finalScore,
      score: finalScore,
      platformPeak: trafficScore >= PLATFORM_PEAK_THRESHOLD,
      lowTraffic: trafficScore < TRAFFIC_LOW_THRESHOLD,
    }
  })
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- trafficWindow`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/domain/scoring/trafficWindow.ts src/domain/scoring/trafficWindow.test.ts
git commit -m "feat(scoring): 流量窗口层 applyTrafficWindow（第②段）"
```

---

## Task 9: 接管 `scoring/index.ts` 管线 + `now` 注入 + 测试改写

**Files:**
- Create: `src/domain/scoring/qimenCache.ts`（拆出 `getQiMen` 解循环依赖）
- Modify: `src/domain/scoring/index.ts`（`scoreDay` / `computeForecast` / `computeDailyFortune` / `computeCalendar` / `computeSchedule`；`getQiMen` 改为 re-export）
- Create: `src/domain/scoring/scoring.personalization.test.ts`
- Modify: `src/domain/domain.test.ts:183-196`（重写 1 个旧测试）

- [ ] **Step 0: 拆出 `getQiMen` 到独立文件（解模块循环）**

Create `src/domain/scoring/qimenCache.ts`：

```ts
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
```

在 `src/domain/scoring/hourFortune.ts` 顶部把 `import { getQiMen } from '@/domain/scoring'` 改为 `import { getQiMen } from '@/domain/scoring/qimenCache'`。

- [ ] **Step 1: 写失败测试（核心回归 T1–T7）**

Create `src/domain/scoring/scoring.personalization.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { computeBaZi } from '@/domain/bazi'
import { getVideoType } from '@/data/videoTypes'
import { computeForecast } from '@/domain/scoring'

const video = getVideoType('knowledge')!
const NOW = new Date('2026-05-18T12:30:00')

// 两个日主五行明显不同的命主
const chartGeng = computeBaZi({ year: 1990, month: 5, day: 15, shiChenIndex: 7, gender: '男' }) // 庚金
const chartJia = computeBaZi({ year: 1984, month: 2, day: 10, shiChenIndex: 3, gender: '女' })

const hour = (f: ReturnType<typeof computeForecast>, idx: number) =>
  f.target.hours.find((h) => h.shiChenIndex === idx)!

describe('时辰个人化择时（回归断言）', () => {
  it('T1 不同八字 → 不同时辰排名（验收金标准）', () => {
    const a = computeForecast(chartGeng, video, '2026-05-18', '抖音', NOW)
    const b = computeForecast(chartJia, video, '2026-05-18', '抖音', NOW)
    const seqA = a.bestHours.map((h) => h.shiChenIndex).join(',')
    const seqB = b.bestHours.map((h) => h.shiChenIndex).join(',')
    expect(seqA).not.toBe(seqB)
  })

  it('T3 活跃窗口内：finalScore 相对序 == 纯命理 fortuneScore 相对序', () => {
    const f = computeForecast(chartGeng, video, '2026-05-18', '抖音', NOW)
    // 取均为活跃窗口（factor=1）的时辰：午6/未7/戌10/亥11（抖音 hourScores 均 >=50 实为 60/80/92/95）
    const active = [6, 7, 10, 11].map((i) => hour(f, i))
    for (const h of active) expect(h.trafficFactor).toBe(1)
    const byFinal = [...active].sort((x, y) => y.finalScore - x.finalScore).map((h) => h.shiChenIndex)
    const byFortune = [...active].sort((x, y) => y.fortuneScore - x.fortuneScore).map((h) => h.shiChenIndex)
    expect(byFinal).toEqual(byFortune)
  })

  it('T4 凌晨吉时降权不剔除：寅时仍在列表、finalScore>0、lowTraffic 标注', () => {
    const f = computeForecast(chartGeng, video, '2026-05-18', '抖音', NOW)
    const yin = hour(f, 2)
    expect(yin).toBeTruthy()
    expect(yin.finalScore).toBeGreaterThan(0)
    expect(yin.lowTraffic).toBe(true)
    expect(yin.trafficFactor).toBeLessThan(1)
  })

  it('T6 注入固定 now → forecast 可复现', () => {
    const a = computeForecast(chartGeng, video, '2026-05-18', '抖音', NOW)
    const b = computeForecast(chartGeng, video, '2026-05-18', '抖音', NOW)
    expect(a.bestHours.map((h) => h.finalScore)).toEqual(
      b.bestHours.map((h) => h.finalScore),
    )
  })

  it('T7 不同 now → 当下局不同 → 结果可不同', () => {
    const a = computeForecast(chartGeng, video, '2026-05-18', '抖音', new Date('2026-05-18T12:30:00'))
    const b = computeForecast(chartGeng, video, '2026-05-18', '抖音', new Date('2026-08-20T03:30:00'))
    const differ =
      a.target.overall !== b.target.overall ||
      a.target.hours.map((h) => h.fortuneScore).join(',') !==
        b.target.hours.map((h) => h.fortuneScore).join(',')
    expect(differ).toBe(true)
  })

  it('reasons 含十神解释文案', () => {
    const f = computeForecast(chartGeng, video, '2026-05-18', '抖音', NOW)
    expect(f.target.hours[0].reasons.length).toBeGreaterThan(0)
    expect(f.target.hours[0].reasons.some((r) => /时柱/.test(r))).toBe(true)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- scoring.personalization`
Expected: FAIL（`computeForecast` 尚不接受第 5 参 `now`；hours 无 `fortuneScore`/`lowTraffic`/`reasons`）

- [ ] **Step 3: 改写 `src/domain/scoring/index.ts`**

按以下要点改造（保留 `baziDayScore` / `videoMatchScore` / `videoAffinityScore` / `scoreGrade` / `buildDecision` / `Forecast` / `DayScore` 等现有导出；`HourScore` 接口可删除并由 `RankedHour` 取代，但需保证消费方字段不变）：

1. 顶部 import 调整：
```ts
import { scoreHourFortune, type DayContext } from '@/domain/scoring/hourFortune'
import { applyTrafficWindow, type RankedHour } from '@/domain/scoring/trafficWindow'
import { buildPresentDivination, type PresentDivination } from '@/domain/scoring/present'
export { getQiMen } from '@/domain/scoring/qimenCache' // re-export，保持对外 API 不变
```
删除原文件内的 `qimenCache` Map 与 `getQiMen` 定义（已迁至 `qimenCache.ts`）。

**清理改写后变成未用的旧符号/导入**（否则 `tsc --noEmit`（项目开了 `noUnusedLocals`）会报错）：
- 删除私有函数 `combine`（`scoreDay` 改写后不再调用）。
- 删除来自 `scoringConfig` 的 `SCORE_WEIGHTS` import（仅 `combine` 用过）。
- 删除 `PLATFORM_HOUR_WEIGHT` import（旧逐时辰混合逻辑已迁至 `trafficWindow.ts`）。
- `PLATFORM_PEAK_THRESHOLD` 也不再被 `index.ts` 直接使用（迁至 `trafficWindow.ts`），从 `index.ts` 的 import 中删除。
- 保留 `getPlatformProfile`（`computeForecast` 仍用它取 `forecastDays`）、`SHI_CHEN`、`GAN_WU_XING`/`ZHI_WU_XING`（`baziDayScore`/`videoMatchScore` 仍用）、`clamp`。
- 删除原 `computeQiMen` / `evaluateQiMen` 的 import（迁至 `qimenCache.ts` 后 `index.ts` 不再直接用）；改为 `export { getQiMen } from '@/domain/scoring/qimenCache'`。

2. `DayDetail.hours` 类型由 `HourScore[]` 改为 `RankedHour[]`。`HourScore` 接口删除（`RankedHour` 已覆盖其全部字段：`shiChenIndex/name/range/score/qimenScore/qimen/platformPeak`）。检查并更新页面 import（见 Task 10）。

3. 重写 `scoreDay`，新增 `present` 参数：
```ts
function scoreDay(
  chart: BaZiChart,
  video: VideoType,
  y: number,
  m: number,
  d: number,
  platform: string,
  present: PresentDivination,
): DayDetail {
  const huangli = computeHuangLi(y, m, d)
  const dayGanZhi = huangli.dayGanZhi
  const baziDay = baziDayScore(chart, dayGanZhi)
  const videoScore = videoMatchScore(video, chart, dayGanZhi)
  // 日维基线：八字日支 + 黄历 + 视频契合（全天恒定）
  const dayBaselineScore = clamp(
    Math.round(baziDay * 0.45 + huangli.score * 0.3 + videoScore * 0.25),
    0,
    100,
  )
  const ctx: DayContext = { dayGanZhi, dayBaselineScore }

  const fortunes = SHI_CHEN.map((sc) =>
    scoreHourFortune(chart, y, m, d, sc.index, ctx, present),
  )
  const hours = applyTrafficWindow(fortunes, platform)

  const meanFortune =
    fortunes.reduce((a, f) => a + f.fortuneScore, 0) / fortunes.length
  const overall = clamp(Math.round(meanFortune + present.toneShift), 0, 100)
  const qimenAvg = Math.round(
    fortunes.reduce((a, f) => a + f.qimenDayMaster.quality, 0) / fortunes.length,
  )

  return {
    date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    dayGanZhi,
    baziDayScore: baziDay,
    videoScore,
    huangli,
    hours,
    qimenAvg,
    overall,
  }
}
```

4. `computeForecast` 增加 `now` 参数并起一次当下局，所有 `scoreDay` 调用传 `present`：
```ts
export function computeForecast(
  chart: BaZiChart,
  video: VideoType,
  targetDate: string,
  platform: string,
  now: Date = new Date(),
): Forecast {
  const present = buildPresentDivination(now)
  const d0 = fromYmd(targetDate)
  const target = scoreDay(
    chart, video, d0.getFullYear(), d0.getMonth() + 1, d0.getDate(), platform, present,
  )
  const bestHours = [...target.hours].sort((a, b) => b.score - a.score)

  const forecastDays = getPlatformProfile(platform).forecastDays
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const futureDays: DayScore[] = []
  for (let i = 0; i < forecastDays; i++) {
    const dt = new Date(today)
    dt.setDate(today.getDate() + i)
    const detail = scoreDay(
      chart, video, dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), platform, present,
    )
    futureDays.push({
      date: toYmd(dt),
      weekday: WEEKDAYS[dt.getDay()],
      score: detail.overall,
      dayGanZhi: detail.dayGanZhi,
    })
  }
  const bestDays = [...futureDays].sort((a, b) => b.score - a.score)
  return { target, bestHours, futureDays, bestDays }
}
```

5. 同样为 `computeDailyFortune` / `computeCalendar` / `computeSchedule` 增加 `now: Date = new Date()` 末参，内部 `const present = buildPresentDivination(now)`，并把 `present` 透传给各自的 `scoreDay` 调用。`HourScore` 在这些函数的返回类型（如 `DailyFortune.hours`）统一改为 `RankedHour[]`。

6. `HourScore` 导出若被外部 import，新增类型别名兜底：`export type HourScore = RankedHour`（置于 `trafficWindow.ts` import 之后），避免页面层 import 报错。

7. 把当下局 headline 接到 `Forecast`（闭合数据流 step ④，否则 `present.headline` 算了被丢弃）：在 `Forecast` 接口加 `presentHeadline: string`，在 `computeForecast` 返回对象里加 `presentHeadline: present.headline`。同理给 `DailyFortune` 接口加 `presentHeadline: string` 并在 `computeDailyFortune` 返回中赋值 `present.headline`。现有测试未穷举 `Forecast` 字段，新增字段不会破坏它们。

- [ ] **Step 4: 重写旧测试 `src/domain/domain.test.ts:183-196`**

将该 `it(...)` 块整体替换为（保留 `describe('评分引擎')` 其余测试不动）：

```ts
  it('平台流量为窗口约束：换平台不改当日总分，且不污染活跃窗口内命理序', () => {
    const chart = computeBaZi({ year: 1992, month: 3, day: 20, shiChenIndex: 5, gender: '男' })
    const video = getVideoType('knowledge')!
    const now = new Date('2026-05-18T12:30:00')
    const dou = computeForecast(chart, video, '2026-05-18', '抖音', now)
    const bili = computeForecast(chart, video, '2026-05-18', 'B站', now)
    // 当日总分只来自命理，与平台无关
    expect(dou.target.overall).toBe(bili.target.overall)
    const hour = (f: typeof dou, idx: number) =>
      f.target.hours.find((h) => h.shiChenIndex === idx)!
    // 凌晨低流量时辰被降权但不剔除（降权不剔除）
    const yin = hour(dou, 2)
    expect(yin.lowTraffic).toBe(true)
    expect(yin.finalScore).toBeGreaterThan(0)
    expect(yin.trafficFactor).toBeLessThan(1)
    // 晚间高峰时辰为活跃窗口，命理全权（factor=1）
    expect(hour(dou, 11).platformPeak).toBe(true)
    expect(hour(dou, 11).trafficFactor).toBe(1)
  })
```

- [ ] **Step 5: 跑全量测试**

Run: `npm test`
Expected: PASS（原 26 个绿 + 重写 1 个绿 + 新增 T1/T3/T4/T6/T7 等全绿）。若 `computeForecast` 调用方因新增可选参数报类型错，确认所有内部调用已传 `present`/`now`。

- [ ] **Step 6: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误。重点排查页面层对 `HourScore` 的 import（`HourScore = RankedHour` 别名应已兜住）。

- [ ] **Step 7: 提交**

```bash
git add src/domain/scoring/ src/domain/domain.test.ts
git commit -m "feat(scoring): 两段式管线接管 + now 注入 + 回归断言；重写流量旧测试"
```

---

## Task 10: UI 最小接入 + 验证闭环

**Files:**
- Modify: 消费 `hours` 的页面（按 `npx tsc --noEmit` 报错定位，通常 `src/pages/ResultPage.tsx`）
- 验证：截图走查 + 典籍核验 + 基线命令

- [ ] **Step 1: 定位 UI 消费点**

Run: `grep -rn "\.hours" src/pages src/components | grep -v test`
Run: `grep -rn "HourScore\|qimenScore\|platformPeak\|bestHour" src/pages src/components | grep -v test`
确认页面读取的字段（`score` / `name` / `range` / `qimen` / `platformPeak`）在 `RankedHour` 中均存在 → 多数页面零改动即可编译通过。

- [ ] **Step 2: 最小接入解释文案**

在 `src/pages/ResultPage.tsx` 展示最佳时辰处，把 `bestHour.reasons`（`string[]`）渲染为一行小字说明（若已有时辰展示块，在其下追加）。示例（按页面既有样式 token 调整，勿照搬 class）：

```tsx
{bestHour.reasons.length > 0 && (
  <ul className="mt-2 space-y-1 text-sm text-qingmo">
    {bestHour.reasons.map((r, i) => (
      <li key={i}>· {r}</li>
    ))}
  </ul>
)}
```

若 `Forecast` 需要透出当下局 headline，在 ResultPage 顶部读 `forecast` 来源处补充展示 `present.headline`——但 `Forecast` 当前未含 present。**最小接入下本步可跳过 headline**，仅渲染 `reasons`（headline 透出留待后续 UI 版本，见 spec §10）。

- [ ] **Step 3: 跑类型 + 全量测试**

Run: `npx tsc --noEmit && npm test`
Expected: 类型干净；全部测试绿。

- [ ] **Step 4: 截图走查（Screenshot-Implement，CLAUDE.md §8）**

启动 `npm run dev`（注意 base 路径 `http://localhost:5173/yuanji-fortune/`）。用 webapp-testing skill 注入示例八字并截 `/result`：

```python
page.evaluate("""
  localStorage.setItem('zmf:bazi', JSON.stringify({
    year: 1990, month: 5, day: 15, shiChenIndex: 3, gender: "男"
  }));
""")
page.goto("http://localhost:5173/yuanji-fortune/#/result")
page.wait_for_load_state("networkidle")
```

核对：
- 推荐时辰**不再清一色午/戌/亥**（换不同八字截两次对比，最佳时辰应不同）
- `reasons` 文案显示完整、不截断
- 凌晨吉时若出现，带"流量低谷"语义（若 UI 已接 lowTraffic 标注）

- [ ] **Step 5: 典籍核验（Claude Code 侧，单手做）**

请 Claude Code 派"典籍考据员"只读核验 `src/domain/shensha/index.ts` 四张查表（天乙贵人/驿马/桃花/文昌）对照标准命理口诀，仅返回核验结论；如需订正只改常量值，重跑 `npm test -- shensha`。

- [ ] **Step 6: 最终基线**

Run: `npx tsc --noEmit`
Run: `npm test`（全绿）
Run: `npm run build`（构建通过）

- [ ] **Step 7: 提交**

```bash
git add src/pages
git commit -m "feat(ui): /result 最小接入命理解释文案 reasons"
```

---

## 验收标准（对照 spec §9）

- [ ] T1 通过：两个不同八字得到不同时辰排名（"千篇一律"病根钉死）
- [ ] 原有测试除重写的 1 个外全部原样绿；奇门张志春两案例（`domain.test.ts:104-135`）未改动
- [ ] 推荐结果可解释：`reasons` 含十神/神煞/奇门占断文案
- [ ] 凌晨吉时降权但 `finalScore > 0`（决策 A 成立），带 `lowTraffic` 标注
- [ ] 固定 `now` 可复现（T6），不同 `now` 结果可变（T7）
- [ ] `npx tsc --noEmit` 干净、`npm run build` 通过

## 不在本计划范围（YAGNI，见 spec §10）

真太阳时校正、接入用户粉丝活跃时段数据、`/result` 完整可视化解释面板、全时柱旺衰扰动模型。
