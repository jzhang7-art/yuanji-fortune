# AGENTS.md — 玄机 · 发布择时

> 这是给 AI 协作 Agent(Codex / Claude Code 等)的项目首读文件。
> 项目历史背景与设计语言细节见同目录 `CLAUDE.md`,本文件聚焦"接手就能干活"。
>
> **协作模式**:Claude Code + Codex **同时协作**。Codex 主要负责落地实施(写代码 / 跑测试 / 部署),
> Claude Code 主要负责架构 / 设计 / UX 决策。两者共享 `.claude/settings.local.json` 权限白名单。

---

## 1. 项目名称与目标

**项目名**:玄机 · 发布择时(`zimedia-fortune-app`)

**目标**:帮自媒体创作者(抖音 / 小红书 / B 站 / 视频号)用传统术数找最佳发布时机。
用户输入八字 → 选视频类型 + 平台 + 日期 → 用八字 / 黄历 / 奇门遁甲三套算出「发布指数 %」+ 推荐最佳时辰与吉日。

**当前阶段**:验证期(无收费,纯本地,无后端)。已部署 GitHub Pages 内测。

**基调**:专业感(真实术数算法)+ 娱乐免责(所有页面带 Disclaimer,不构成医疗 / 法律 / 投资 / 命运决策建议)。

---

## 2. 技术栈

| 层 | 技术 |
|---|---|
| 框架 | React 19 + React Router 7 (HashRouter) + TypeScript 5.7 |
| 构建 | Vite 6,base = `/yuanji-fortune/`(GitHub Pages 子路径) |
| 样式 | Tailwind v4(`@theme` 在 `src/index.css`),设计 token 内置 |
| 动画 | framer-motion 11(`useReducedMotion` 全应用兜底) |
| 3D | three 0.184 + `@react-three/fiber@^9` + `@react-three/drei@^10`(WebGL 失败回退 SVG) |
| 命理库 | `lunar-typescript`(农历 + 八字),**奇门遁甲自研** |
| 持久化 | localStorage(key 前缀 `zmf:`),`src/storage/index.ts` 是 async 接口预留后端 |
| 测试 | vitest 3 + @testing-library/react + jsdom(76 个单元/组件测试) |
| PWA | vite-plugin-pwa(Workbox,manifest 在 `public/manifest.webmanifest`) |
| 埋点 | posthog-js(`VITE_POSTHOG_KEY` 缺失会静默丢弃) |
| 图像导出 | html-to-image(分享卡片栅格化) |

---

## 3. 本地运行命令

```bash
# 安装依赖（首次/拉取后）
npm install --legacy-peer-deps     # peer-deps:R3F + React 19 需要

# 复制环境变量（可选,缺失只影响埋点）
cp .env.example .env.local
# 编辑 .env.local 填 VITE_POSTHOG_KEY=phc_xxx

# 本地开发(默认 http://localhost:5173/yuanji-fortune/)
npm run dev

# 局域网手机预览
npm run dev -- --host
```

注意 base 路径:浏览器要进 `http://localhost:5173/yuanji-fortune/`,不带后缀会 404 提示。

---

## 4. 测试与构建命令

```bash
npm test                  # vitest run,76/76 必须过
npm run build             # tsc -p tsconfig.json && vite build
                          # JS gzip ~493 KB(含 three.js),CSS gzip ~7.6 KB
npm run preview           # 预览生产构建
npx tsc --noEmit          # 单跑类型检查
```

**修改 `src/domain/` 算法前后必跑 `npm test`,27 个 domain 测试是地基**。

UI 变更建议走 Screenshot-Implement 循环(CLAUDE.md §8.Screenshot-Implement):
注入 `zmf:bazi` localStorage → Playwright 截图 → 视觉对比 → 改 → 再截。

---

## 5. 目录结构

```
.
├── AGENTS.md              ← 你正在看的文件
├── CLAUDE.md              ← 项目历史 / 设计语言细节
├── docs/CODEX_HANDOFF.md  ← 详细交接文档(能力 / 风险 / 上线检查)
├── index.html             ← Vite 入口,%BASE_URL% 模板用于子路径
├── package.json           ← scripts: dev / build / preview / test
├── vite.config.ts         ← base + PWA + alias 配置
├── vitest.config.ts       ← jsdom 环境 + setup-files
├── vercel.json            ← Vercel 备用部署(rewrites + 缓存头)
├── .github/workflows/
│   └── deploy.yml         ← GitHub Pages 自动部署
├── public/                ← 静态资源(图标 + manifest + 微信二维码)
├── tests/static/          ← 构建产物的静态测试(bundle 体积 / index.html 元信息)
└── src/
    ├── App.tsx            ← 路由 + 首启守卫(无八字 → LotusOnboarding 全屏)
    ├── main.tsx           ← 入口
    ├── index.css          ← Tailwind v4 @theme + 设计 token
    ├── state/             ← AppState Context (baziInput / publishInfo / ready)
    ├── storage/           ← localStorage 异步接口 + 业务存储 schema
    ├── hooks/             ← useBaZiChart 等
    ├── pages/             ← 12 个页面组件(见 §6 路由表)
    ├── components/
    │   ├── Layout.tsx     ← header + Stepper + BottomNav 包壳
    │   ├── ui.tsx         ← Card / Pill / ScoreBar 等基础原子
    │   ├── RowLink.tsx    ← /me /settings 玻璃行
    │   ├── TrackPickerSheet.tsx  ← Dashboard「我的赛道」底部 sheet (React Portal)
    │   ├── loading/MysticLoader.tsx  ← 主题加载组件
    │   ├── onboarding/LotusOnboarding.tsx  ← 莲花拨号轮(onboarding + edit 两态)
    │   ├── result/        ← ResultHero / ResultPanels (兑换锁前 / 锁后)
    │   └── decor/         ← TianwenChart(R3F) + SVG fallback / SkyDome28Xiu / FortuneScene
    ├── domain/            ← 命理算法层(纯函数,无 React)
    │   ├── bazi/          ← computeBaZi (lunar-typescript 包一层)
    │   ├── huangli/       ← 黄历 + 传播气场
    │   ├── qimen/         ← 奇门遁甲(自研,拆补法 + 转盘法)
    │   ├── scoring/       ← 评分引擎(四维加权)
    │   ├── wuxing.ts      ← 五行关系 + WU_XING_COLOR 配色
    │   └── domain.test.ts ← 27 个 ground truth 测试
    ├── data/              ← 静态数据(videoTypes / ganzhi / platforms / scoringConfig)
    ├── motion/            ← Stagger / PageTransition / Reveal / transitions / variants
    ├── analytics/         ← PostHog 埋点 + 同意流
    ├── features/invite/   ← 邀请码白名单 + LockedSection 兑换卡
    ├── platform/          ← session / dialog / scroll(Web vs 微信小程序适配桩位)
    ├── util/feedback.ts   ← 拨号轮触感反馈(vibrate + Web Audio 木质 tock)
    └── util.ts types.ts   ← 通用工具 / 全局类型
```

---

## 6. 路由表

| 路径 | 页面 | 说明 |
|---|---|---|
| `/` | DashboardPage | 首页(3D 星盘 + 下个吉时 + 12 时辰展开 + **我的赛道** + 今日内容风向 + CTA) |
| `/lotus` | LotusOnboarding | 八字编辑(edit 模式,从已存八字 prefill,× 返回) |
| `/bazi` | BaZiPage | 命盘 Hub(命主行 + 四柱 + 2×2 入口) |
| `/publish` | PublishPage | 选视频类型 + 平台 + 日期 → 「开始推演」 |
| `/result` | ResultPage | 测算结果(Hero + 12 时辰最佳 + 锁后 7 张面板) |
| `/schedule` | SchedulePage | 同类视频未来 14 天最佳档期 |
| `/calendar` | CalendarPage | 本月吉日热力图(未邀请码:仅本周可见) |
| `/talent` | TalentPage | 命定赛道排名 |
| `/me` | MePage | 命主卡 + 玻璃 row 列表 |
| `/settings` | SettingsPage | 重排生辰 / **我的赛道** / 清空历史 / 邀请码 |
| `/history` | HistoryPage | 测算历史 |
| `/about` | AboutPage | 产品介绍 + 致谢 + 联系微信 + 免责 |
| `/privacy` | PrivacyPage | 隐私政策 / 用户协议(Tab `?tab=privacy\|terms`) |

**首启守卫**:`App.tsx` 检测 `baziInput === null` 时全屏渲染 `LotusOnboarding`,旁路 Layout。

---

## 7. 关键业务模块

### 7.1 八字模块 — `src/domain/bazi/`

- 入口:`computeBaZi(input: BaZiInput): BaZiChart`
- 实现:基于 `lunar-typescript`,把公历年月日时分转换为四柱(年/月/日/时)干支 + 日主五行 + 喜用神
- 输入:`{ year, month, day, shiChenIndex (0-11), gender ('男' | '女') }`
- 输出:`BaZiChart` 含 `year/month/day/time` Pillar 对象、`dayMaster` 日干、`dayMasterWuXing`、`strength`、`favorable[]`
- **时辰索引 0=子时 23:00-01:00**,见 `src/data/ganzhi.ts:SHI_CHEN`

### 7.2 黄历模块 — `src/domain/huangli/`

- 入口:`computeHuangLi(y,m,d)` → `{ ganZhi, xiu (二十八宿), qiChang (传播气场), score }`
- 传播气场 `qiChang.level: '旺' | '平' | '弱'` + `reading` 一句话点评(展示在 Dashboard hero 下)
- 「宜忌」由当日黄历宜忌 + 自定义"传播倾向"映射,文案库在模块内

### 7.3 奇门遁甲模块 — `src/domain/qimen/` ★ 自研重点

- 入口:`computeQiMen(y,m,d,h): QiMenResult`
- **算法**:**拆补法定局 + 转盘法排盘**(已参考张志春《神奇之门》两例案校验)
  - JU_TABLE 节气阴阳遁定局
  - 三奇六仪填地盘
  - 值符 / 值使 起转
  - 天盘九星沿洛书随值符旋转
  - **八门值使沿九宫数序 1→2→…→9→1 移动**(**不是**洛书轨迹),**阳顺阴逆**——这是踩过的坑,改动必须保留
  - 八神固定按阴阳遁排序
- 评分:对当时时局给 PalaceState[]、值符星、值使门、奇门组合的吉凶概率
- **caveat**:节气交界附近(立春/惊蛰等切换日)由于 lunar-typescript 节气精度,仍需更多案例验证。**改动前必跑 `npm test`**,27 个 ground truth 测试在 `src/domain/domain.test.ts`
- 参考典籍:用户 Obsidian `~/Documents/minghefu-vault/08-资料库/典籍库/子部/神奇之门-张志春.md` 含两个完整排盘案例

### 7.4 评分引擎 — `src/domain/scoring/`

- 四维加权(`src/data/scoringConfig.ts:SCORE_WEIGHTS`):
  - `bazi: 0.35` 八字喜用神 vs 当日干支
  - `huangli: 0.25` 当日黄历宜忌
  - `qimen: 0.25` 奇门时局
  - `videoMatch: 0.15` 视频类型五行契合度
- 平台档案 `PLATFORM_PROFILES`:抖音 / 小红书 / 视频号 / B 站 / 快手 / 其他,各自的 `forecastDays`(1-7) + 12 时辰流量强度
- 关键导出:
  - `getQiMen(y,m,d,h)` 记忆化奇门排盘(整 App 共享 cache)
  - `videoAffinityScore(video, chart)` 五行契合度(platform 无关,Dashboard 风向榜用)
  - `scoreDay(chart, video, y,m,d, platform)` 单日 12 时辰 + 四维加权
  - `computeForecast(chart, video, date, platform)` 包含 target 日 + 未来 N 天(N=平台 forecastDays)
  - `computeDailyFortune(chart, date, platform)` Dashboard 用:`dayScore` + `hours` + `huangli` + `typeRanking`
  - `computeCalendar(chart, fromDate, days)` 日历热力图
  - `computeSchedule(chart, video, ...)` 多期排档
  - `scoreGrade(score)` 0-100 → 「大吉 / 吉 / 平 / 凶 / 大凶」+ tone

### 7.5 localStorage 存储层 — `src/storage/index.ts`

接口全部 `async`,底层 localStorage(key 前缀 `zmf:`),为后续接后端预留:

| Key | 类型 | 说明 |
|---|---|---|
| `zmf:bazi` | `BaZiInput` | 用户八字(唯一录入来自 `/lotus`) |
| `zmf:history` | `HistoryRecord[]` | 测算历史(`HISTORY_MAX` 上限) |
| `zmf:tracks` | `PreferredTracks` | Dashboard「我的赛道」自选(trackIds + platform) |
| `zmf:consent` | `'granted' \| 'denied'` | 埋点同意状态(`src/analytics/consent.ts`) |

所有 load 函数都做白名单校验(防止 localStorage 注入异常值),非法时返回 null。
`eraseAllUserData()` 一键清空所有 `zmf:` 键 + PostHog 自有 key。

### 7.6 前端页面

参见 §6 路由表。所有页面通过 `<Layout>` 提供 header + Stepper + BottomNav + Disclaimer + safe-area。**唯一例外**:`LotusOnboarding`(onboarding 模式)直接全屏,自己处理 safe-area。

页面间状态共享走 `AppState Context`(baziInput / publishInfo / ready flag)。

---

## 8. 重要产品决策

| 决策 | 落地约束 |
|---|---|
| **Web 优先** | 不写 Native;微信小程序适配位预留在 `src/platform/`(session/dialog/scroll 接口可平台切换) |
| **用户手动选择视频类型** | 不做 AI 视频识别;`src/data/videoTypes.ts` 17 个分类,五行映射 |
| **不上传视频文件** | 用户不传 mp4/截图,只填类型 + 标题 + 时长(选填) |
| **本地存储优先,后续预留后端** | 所有 storage 接口 async,改成 fetch 即可换后端 |
| **专业感 + 娱乐免责** | 算法真用奇门 / 八字,但 `<Disclaimer>` 在 Layout 强制不可删 |
| **结果页不展示奇门九宫盘面,只保留奇门评分和文字结论** | `ResultPanels.tsx` 奇门 Card 只显示当时时局 dunType + juShu + 高亮组合 + 文字 summary,**不渲染九宫格** |
| **八字唯一录入入口 = `/lotus`** | 任何其他页面禁加 input;重排八字只走莲花拨号轮 |
| **首页 3D 星盘必须有 SVG fallback** | WebGL 失败 / 低端机降级到 `TianwenChartSvgFallback` |
| **设计 token 不可破坏五行配色语义** | 四柱干支字符必须用 `WU_XING_COLOR` inline style,禁用固定色 class 覆盖 |
| **PWA HashRouter** | 用 hash 路由是为 GitHub Pages 子路径友好;改 BrowserRouter 要同步改 `vercel.json` rewrites |

---

## 9. 后续研发优先级建议

按 ROI 从高到低:

1. **节气交界奇门测试加强**(高优):立春 / 惊蛰 / 夏至这类切换日 ±1 天的奇门排盘多补几组人工核验测试,目前 27 个测试中节气交界覆盖较少
2. **后端 + 跨设备同步**(中):storage 层接口 async 已就绪,接 Supabase/Firebase 改 storage impl 即可,不动业务
3. **结果分享卡片优化**(中):`ShareCardModal` 当前用 html-to-image,部分 Android 字体回退不完美;考虑 SSR 出图
4. **微信小程序版本**(低,等 Web 验证完):`src/platform/` 已埋接口,但 R3F 浑天仪需大改(小程序不支持 WebGL)
5. **付费墙完善**(低):`src/features/invite/` 是白名单邀请码,未来接支付要换实现
6. **更多视频类型 / 平台档案**:`src/data/videoTypes.ts` + `scoringConfig.ts` 加品类即可,无算法依赖

---

## 10. 开发注意事项

### 红线(碰必须有理由)

- **不要提交 `.env.local`**(已 .gitignore;含 PostHog key)
- **不要提交 `dist/` / `node_modules/` / `.codegraph/` / `.vercel/`**(已 .gitignore)
- **修改 `src/domain/qimen/` 或 `src/domain/scoring/` 必须补测试**;27 个测试是地基。改前先读 `src/domain/domain.test.ts`
- **修改评分权重 `SCORE_WEIGHTS` 必须同步更新 README/docs**,且重跑所有 domain 测试快照对比
- **八字编辑入口只能是 `/lotus`**,不要在其他页加 input
- **奇门八门值使沿九宫数序 1→2→…→9 移动,阳顺阴逆**;不是洛书轨迹——这是修过的坑,改动须保留
- **R3F 组件必须有 SVG fallback**(WebGL 失败 / 低端机降级)
- **`<Disclaimer>` 不可移除**——娱乐免责声明是产品基调

### 一般规范

- UI 移动端优先(`max-w-md` 主容器),不做桌面专属布局
- 一屏最多 1 个强色块(zhusha 朱砂 / jin 金 不滥用)
- 干支字符颜色走 `WU_XING_COLOR` inline style,不用固定色 class
- 动画用 framer-motion,CSS 只做 `prefers-reduced-motion` 兜底
- LocalStorage key 必带 `zmf:` 前缀
- 路由文案改了同步改 `src/components/Stepper.tsx`
- R3F + React 19 兼容:`@react-three/fiber@^9` + `@react-three/drei@^10`,旧版会 peer 冲突
- npm install 加 `--legacy-peer-deps`(R3F + React 19 需要)

### 验证基线(改动前后都跑)

```bash
npx tsc --noEmit          # 0 错
npm test                  # 76/76 过
npm run build             # gzip JS ~493 KB, CSS ~7.6 KB
```

UI 改动额外走 Screenshot-Implement 循环(CLAUDE.md §8)。

---

## 11. 部署

- **生产**:GitHub Pages,base `/yuanji-fortune/`,自动部署 `.github/workflows/deploy.yml`,push main 触发,~1 分钟完成
  - URL:`https://jzhang7-art.github.io/yuanji-fortune/`
  - PostHog key 走 Actions secret `VITE_POSTHOG_KEY`
- **备用**:Vercel,`vercel.json` 已配 rewrites + 缓存头(`sw.js` no-cache,`assets/` 1 年 immutable),改 base 后可启用

详见 `docs/CODEX_HANDOFF.md` §部署。

---

## 12. 已知雷区(踩过的坑)

- iOS PWA 白屏:`index.html` 里 manifest / icon 路径必须用 `%BASE_URL%` 前缀,绝对路径 `/icons/...` 会在子路径部署下 404
- ResultPage loader:`computeForecast` 同步阻塞,必须 RAF + `setTimeout 0` 双层 defer 才能让骨架先 paint(见 `src/pages/ResultPage.tsx`)
- TrackPickerSheet z-index 困:`Layout main` 有 `relative z-[1]` 锁了 stacking context,sheet 必须 React Portal 挂 body 才能盖过 BottomNav
- React 19 + R3F peer:`npm install` 必须 `--legacy-peer-deps`,否则会拒绝安装
