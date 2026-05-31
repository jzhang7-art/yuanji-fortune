# 时辰个人化择时引擎设计

> 设计日期：2026-05-31
> 目标：解决发布择时推荐"千篇一律"（永远午/戌/亥），实现真正按个人八字 + 当下奇门时局算出的精准发布时辰。

---

## 1. 问题诊断

当前 `scoreDay`（`src/domain/scoring/index.ts:128-149`）逐时辰打分时，一天之内随时辰变化的量只有两个：奇门时局分（权重 0.25）和平台流量分（权重 0.12）。其余三项（八字喜用 vs 当日干支、黄历宜忌、视频契合）**全天恒定**。

由此产生两个结构性缺陷：

1. **时辰排名与"你是谁"无关**。八字喜用神只在 `baziDayScore` 里用了**日**干支，作用在"哪天"；到了时辰层是全天常数，**时柱干支根本没进评分**。结果两个八字不同的人，同日同平台的时辰排名完全一致。
2. **平台流量曲线主导时辰排名**。命理侧逐时辰只有 `qimen.score×0.25` 在动（标准差约 ±1.3），而 `platformHour×0.12` 标准差约 ±3.4——平台贡献的方差是命理的约 2.6 倍，且平台峰值恒定在午/戌/亥。于是推荐永远是这几个时辰。

奇门排盘（`computeQiMen`）本身经典籍校验正确，但 `evaluateQiMen` 只取景/生/开三门所在宫打分，**未与用户日干发生任何关系**，所以奇门分对所有人相同。

**结论**：精准度有两条独立的轴——
- **流量轴**（几点有人看）：病根是通用曲线对所有人一样；解药是接用户自己的粉丝活跃时段；纯外部数据问题。
- **命理轴**（你这个人这个时辰旺不旺）：病根是时辰评分没用八字；解药纯靠算法，不依赖任何外部数据。

"千篇一律"100% 是命理轴的病。本设计专治命理轴。

---

## 2. 核心架构决策

### 决策 A：命理定吉时排名，流量做窗口约束

命理算出全天 12 时辰的个人化排名 → 流量只做"有人看"的窗口约束（凌晨吉时**降权而非剔除**，并照实标注"流量低谷"）→ **流量分永不混进命理分**。

理由：纯命理择时会规律性推荐凌晨（命理旺但无人观看），而平台冷启动流量池在凌晨近乎为空，会从机制上掐死发布。"抓用户不抓流量"是**内容/定位层**的策略，不是择时层；择时仍通过流量机制起作用。故流量是真实约束，但只约束"窗口"，不绑架命理排名。

### 决策 B：命理深度 = 丰富（时柱十神 + 神煞 + 奇门日干用神 + 当下起局）

### 决策 C：范围 = 引擎优先，UI 最小接入

本版专注把评分引擎做准做深，附带生成解释文案字段；UI 仅做最小改动让新推荐显示出来。`/result` 等页面的解释面板可视化留待后续版本。

### 决策 D：架构 = 两段式管线

第①段 `scoreHourFortune` 产出**纯命理时辰分**（不含流量）；第②段 `applyTrafficWindow` 把平台流量当重排惩罚因子 + 标注叠上去。架构本身即决策 A 的形状，可测性最强，未来接"粉丝活跃时段"只需换第②段数据源。

---

## 3. 模块划分

所有改动**不碰 `bazi` 旺衰核心、不碰 `qimen` 排盘**（保护 27 个 vitest 地基与奇门张志春案例校验）。

| 文件 | 性质 | 职责 |
|---|---|---|
| `src/domain/shishen.ts` | 新（纯函数） | `shiShenOf(dayMaster, gan)` → 十神名；由五行生克 + 阴阳同异推导 |
| `src/data/shiShenSemantics.ts` | 新（数据表） | 十神 → {自媒体语义, 语义基分} |
| `src/domain/shensha/index.ts` | 新（模块） | `detectShenSha(chart, hourZhi)` → 落在该时支的神煞列表 |
| `src/domain/qimen/index.ts` | 扩展（不改排盘） | 新增 `evaluateQiMenForDayMaster(chart, dayMaster)`，只读 `palaces` |
| `src/domain/scoring/hourFortune.ts` | 新（第①段） | `scoreHourFortune(...)` → 纯命理时辰分 |
| `src/domain/scoring/trafficWindow.ts` | 新（第②段） | `applyTrafficWindow(fortunes, platform)` → 流量窗口惩罚 + 标注 + 终排 |
| `src/domain/scoring/index.ts` | 改 | `scoreDay` / `computeForecast` 改用两段管线；对外 `HourScore` 形状向后兼容 |
| `src/data/scoringConfig.ts` | 改 | 新增命理四层权重、流量窗口阈值/地板、区分度增益、神煞封顶等可调参数 |

---

## 4. 数据结构

```ts
// 第①段产物：纯命理时辰分（与流量、与"谁在看"无关）
interface HourFortune {
  shiChenIndex: number
  name: string; range: string          // 沿用 SHI_CHEN
  hourGanZhi: string                   // 该时辰时柱（来自 lunar）
  shiShen: {                           // 时柱十神层
    gan: string; name: string          // 如「伤官」
    category: string                   // 食伤/官杀/财/印/比劫
    semantic: string                   // 「利表达与传播」
    score: number                      // 语义基分 + 喜忌调节
  }
  shenSha: { name: string; semantic: string; bonus: number }[]  // 神煞层
  qimen: {                             // 奇门日干用神层（角色 A）
    dayMasterPalace: number; quality: number; note: string
  }
  fortuneScore: number                 // 纯命理合成 0–100（已含 B-指向、已拉伸）
  reasons: string[]                    // 解释文案（供 UI 最小接入直接用）
}

// 第②段产物：经流量窗口约束后的可发布排名
interface RankedHour extends HourFortune {
  trafficScore: number    // 平台流量 0–100（通用曲线，未来可换粉丝活跃时段）
  trafficFactor: number   // 窗口惩罚系数 0.55–1.0
  finalScore: number      // = fortuneScore × trafficFactor（命理仍主导排序）
  platformPeak: boolean   // trafficScore >= 80
  lowTraffic: boolean     // trafficScore < 40，凌晨吉时照实告知
}
```

**向后兼容**：现有 `HourScore`（`scoring/index.ts:21-29`）被 `/result`、Dashboard、Schedule、Calendar 消费。`RankedHour` 保留 `HourScore` 全部字段（`shiChenIndex/name/range/score/platformPeak`，其中 `score = finalScore`，`qimen` 字段适配现有结构）。UI 不改也能跑，最小接入只需选读 `reasons` / `shenSha`。

---

## 5. 命理算法（第①段 `scoreHourFortune` 内核）

### 第 1 层 · 时柱十神（个人化主力）

`shiShenOf(dayMaster, gan)` 纯函数，按五行生克 + 阴阳同异定十神（天干阴阳：甲丙戊庚壬=阳，乙丁己辛癸=阴）：

| 时干对日主关系 | 同阴阳 | 异阴阳 |
|---|---|---|
| 同我 | 比肩 | 劫财 |
| 我生 | 食神 | 伤官 |
| 我克 | 偏财 | 正财 |
| 克我 | 七杀 | 正官 |
| 生我 | 偏印 | 正印 |

**十神语义基分表**（`shiShenSemantics.ts`）：

| 十神 | 自媒体语义 | 语义基分 |
|---|---|---|
| 伤官 | 才华外放、吸睛表达，利出彩内容 | +14 |
| 食神 | 亲和输出、稳定创作，利人设积累 | +12 |
| 正官 | 专业权威、正规曝光 | +9 |
| 七杀 | 爆发张力、话题争议性曝光 | +8 |
| 偏财 | 泛流量受众、流量变现 | +7 |
| 正财 | 务实转化、精准买单 | +5 |
| 正印 | 知识口碑、贵人加持、深度积累 | +5 |
| 偏印 | 冷门小众、玄学/技艺向 | +2 |
| 比肩 | 自我表达，但易同质分流 | 0 |
| 劫财 | 与人争流、易被分夺 | −3 |

**喜忌调节（个人化第二维）**：在语义基分之上，按时柱干支五行 vs 命主 `favorable/unfavorable/primaryFavorable` 加减（复用 `baziDayScore` 同款逻辑 `index.ts:57-67`，作用于时柱）。落 `primaryFavorable` 加重、落 `favorable` 加、落 `unfavorable` 减。

> 同一午时：对甲日主是伤官（+14）、对庚日主是七杀（+8），再各自叠加午火对其喜忌的增减 → 天然因人而异。

### 第 2 层 · 神煞落时辰（`detectShenSha`）

按命主日干/日支查，命中落在该**时支**的神煞给加分：

| 神煞 | 查法 | 自媒体语义 | bonus |
|---|---|---|---|
| 天乙贵人 | 日干 → 贵人支 | 贵人相助，易得推流加持 | +8 |
| 驿马 | 日支三合 → 马 | 流动扩散，内容易"跑出圈" | +6 |
| 桃花(咸池) | 日支三合 → 桃花 | 吸引力强，利吸粉涨粉 | +6 |
| 文昌 | 日干 → 文昌支 | 文思才华，利内容质量 | +5 |
| 将星（可选） | 日支三合中神（子午卯酉） | 统御力，利权威曝光 | +4 |

多神煞叠加求和后**封顶**（`scoringConfig` 可调），避免堆叠爆表。

**典籍核验**：实现时派"典籍考据员"只读核验天乙贵人/驿马/桃花/文昌四张查表（单手做，仅只读核验，不并行改码）。

### 第 3 层 · 奇门日干用神（角色 A，`evaluateQiMenForDayMaster`，只读 palaces）

把校验过的奇门盘个人化：取**日干落宫**为用神宫（日干=甲则取旬首六仪宫，即值符宫）——

1. 读 `chart.palaces` 找日干所在地盘宫 → `palaceQuality(该宫)`（复用现有函数）
2. 算该宫与三用神门宫（景/生/开）的生克：日干宫生用神门宫 = 气贯传播（+）、被克 = 受制（−）
3. 产出 `qimen.quality` + 解释 note

> 现有 `evaluateQiMen` 对所有人一样；新增此函数按日干评估，不同日主同一时局得分不同，且严格只读、不碰排盘。

### 第 4 层 · 当下问事起局（角色 B）

**何时起局**：用户点"测算"那一刻 `now` 起一个局（按 now 所在时辰），整次 forecast **只起一次**，自顶向下传递。`now` 做成可注入参数（默认 `new Date()`，测试注入固定时刻）。

**B-指向（落到逐时辰）**：读当下局用神三门（景/生/开）落宫 → 宫位按九宫地支映射回时辰，对应时辰获 boost（按门吉凶 + 落宫质量定量，封顶）：

| 宫 | 卦 | 对应地支/时辰 |
|---|---|---|
| 1 坎 | 北 | 子 |
| 8 艮 | 东北 | 丑·寅 |
| 3 震 | 东 | 卯 |
| 4 巽 | 东南 | 辰·巳 |
| 9 离 | 南 | 午 |
| 2 坤 | 西南 | 未·申 |
| 7 兑 | 西 | 酉 |
| 6 乾 | 西北 | 戌·亥 |

例：当下局景门落离九宫 → 午时得加持，生成"景门临离，午时传播得用"占断。

**B-基调（落到整体）**：对当下盘跑现有 `evaluateQiMen` 得总分 → 映射成 forecast 级基调修正（轻量水位上抬/下压）+ 一句 headline 占断文案。不改时辰间排序，只定整体水位 + 给"此刻该不该折腾"的总判。

### 聚合 → `fortuneScore`

权重进 `scoringConfig.ts`（可调）：

| 分量 | 权重 | 角色 |
|---|---|---|
| 时柱十神（含喜忌） | 38% | 个人化主力 |
| 神煞落时辰 | 12% | 个人化 |
| 奇门·候选时辰日干用神（A） | 18% | 个人化 |
| 奇门·当下局指向（B-指向） | 12% | 占测（随 now 变） |
| 日维基线（八字日支 + 黄历 + 视频契合） | 20% | 日维 |

**区分度拉伸**：`stretched = clamp(50 + (raw − 50) × 1.4, 0, 100)`，治窄带、拉开 top/bottom。

---

## 6. 流量窗口层（第②段 `applyTrafficWindow`）

流量不进命理分，只做末端窗口惩罚重排：

```
trafficScore = PLATFORM_PROFILES[platform].hourScores[index]   // 0–100，未来可换粉丝活跃时段
trafficFactor =
  trafficScore >= 活跃阈值(50) ? 1.0                            // 有人看：命理全权决定
  : 0.55 + 0.45 × (trafficScore / 50)                          // 低流量：降权，地板 0.55
finalScore   = fortuneScore × trafficFactor
lowTraffic   = trafficScore < 40
platformPeak = trafficScore >= 80
```

凌晨吉时被压下但不消失（命理足够强时仍可翻盘），符合决策 A。阈值/地板全部进 `scoringConfig` 可调。

---

## 7. 数据流（`computeForecast` 改写）

```
computeForecast(chart, video, targetDate, platform, now = new Date())
  │
  ├─ ① 起当下局 B = computeQiMen(now…)   ← 整次仅一次，clock 可注入
  │      ├─ B-指向：用神落宫 → 时辰 boost 表
  │      └─ B-基调：evaluateQiMen(B) → 水位修正 + headline 占断
  │
  ├─ ② 逐候选时辰 scoreHourFortune():
  │      时柱十神 + 神煞 + 奇门A(候选时辰日干用神) + B-指向 + 日维基线
  │      → 拉伸 → fortuneScore（纯命理，0–100，与流量无关）
  │
  ├─ ③ applyTrafficWindow() → finalScore + 流量标注（命理仍主导排序）
  │
  └─ ④ B-基调水位修正 → 最终 bestHours / decision + headline
```

`computeDailyFortune` / `computeCalendar` / `computeSchedule` 同步改用两段管线（它们也调 `scoreDay`）。

### 确定性与缓存

| 盘 | 缓存键 | 确定性 |
|---|---|---|
| 候选时家奇门（A） | `y-m-d-h`（沿用现有 `qimenCache`） | 确定 |
| 当下局（B） | `now` 所在时辰 | 随测算时刻变（有意为之，奇门起局正统特性） |

测试一律注入固定 `now`，B 即变确定。

---

## 8. 测试策略

### 现有测试的诚实处理

`domain.test.ts:183-195`（`平台流量为次要项`）编码了旧的"千篇一律"行为：
- `expect(dou.target.overall).toBe(bili.target.overall)` —— **保留**（新设计 overall 仍只来自命理，平台无关）。
- `expect(hour(dou, 11).score).toBeGreaterThanOrEqual(hour(dou, 2).score)`（亥 ≥ 寅）—— **重写**。这条断言"平台峰值时辰永远排前"，正是要修的旧行为；新设计允许命理强时凌晨翻盘。**不为变绿盲目改数字，而是替换成新不变量断言（见 T3/T4/T5）。**

其余 26 个测试（八字 / 黄历 / **奇门排盘张志春案例 :104-135** / 视频五行）全部原样保持绿。奇门两案例是红线，`evaluateQiMenForDayMaster` 只读不写必保不动。

### 核心目标回归断言（新建 `scoring.personalization.test.ts`）

```
T1 不同八字 → 不同时辰排名
   两个日主五行不同的命盘，同日同平台同 now，
   断言纯命理 bestHours 的 top1 不同 OR 排序序列不同。  ← 验收金标准

T2 时柱十神确实进了分
   时柱落喜用 vs 落忌神两种命盘，断言对应时辰 fortuneScore 有显著差。

T3 流量不污染命理序
   12 时辰都在活跃窗口内(factor 全 1.0)时，
   断言 finalScore 排序 == fortuneScore 排序。

T4 降权不剔除
   凌晨吉时(命理高+流量低)被压低但 finalScore > 0 且仍在列表，lowTraffic = true。

T5 命理可翻盘
   构造命理极高的凌晨时辰，断言其能排到流量峰值时辰之前（证明旧行为已破）。
```

### 分层单元测试

| 模块 | 断言 |
|---|---|
| `shiShenOf` | 十神真值表 10 条全覆盖（甲见甲=比肩 … 甲见癸=正印） |
| `detectShenSha` | 日干甲→天乙贵人在丑未；日支寅→驿马在申、桃花在卯；日干甲→文昌在巳 |
| `evaluateQiMenForDayMaster` | 日干落宫定位正确；甲日主走旬首宫 fallback 不抛错；调用前后 `chart` 深比较不变 |
| B-指向映射 | 用神落宫→时辰表正确（离9→午、坎1→子、乾6→戌亥…） |
| `applyTrafficWindow` | 活跃阈值以上 factor=1.0；低流量降权且 ≥ 地板；标注正确 |

### 确定性 / 边界

```
T6 注入固定 now → forecast 可复现（同输入同输出）
T7 不同 now → 当下局 B 不同 → 结果可不同
```

- 所有对外分数 clamp 0–100（拉伸后不溢出）
- 中宫/无门宫不崩；空 video（NEUTRAL_VIDEO）路径正常
- `computeForecast` 不传 `now` 默认 `new Date()`，老调用方零改动

### 引擎之外的验证（非 vitest）

1. 典籍核验：派"典籍考据员"只读核验四张神煞查表
2. Screenshot-Implement：注入示例八字截 `/result`，确认新推荐时辰显示、不再清一色午/戌/亥、`reasons` 不截断
3. 基线：`npx tsc --noEmit` + `npx vitest run`（26 原样绿 + 重写 1 + 新增全绿）+ `npx vite build`

---

## 9. 验收标准

- T1 通过：两个不同八字得到不同时辰排名（"千篇一律"病根被钉死）
- 26 个现有测试原样绿，奇门张志春案例不动
- 推荐结果可解释（`reasons` 含十神/神煞/奇门占断文案）
- 凌晨吉时降权但不消失（决策 A 成立）
- 引擎确定性可测（固定 now），同时保留当下局随时刻而动的正统性

## 10. 不在本版范围（YAGNI）

- 真太阳时经度校正、节气精确到分钟（未来精度增强）
- 接入用户自己的粉丝活跃时段数据替换通用平台曲线（未来流量轴增强，仅需换第②段数据源）
- `/result` 等页面的十神/神煞/奇门可视化解释面板（未来 UI 版本）
- 全时柱命盘旺衰扰动模型（会碰 bazi 核心红线，过度工程）
