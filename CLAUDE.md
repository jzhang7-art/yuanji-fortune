# 玄机 · 发布择时

帮自媒体创作者择时发布的算命 Web App:用户输入八字 → 选视频类型 → 结合**八字 / 黄历 / 奇门遁甲**算出「爆火概率 %」,推荐最佳时辰与吉日。

---

## 0. 北极星 & 当前阶段 ★(开工前必读)

**终局目标**:把「玄机」从"只算时间/赛道的占卜玩具",进化成**真正帮内容好、但不懂平台机制的创作者越做越好的成长工具** = 玄学皮肤(获客+免责) × 成长闭环肌肉(真实价值+变现)。

**完整路线图、当前阶段、下一步任务、Gate 判据 → 见根目录 [`ROADMAP.md`](ROADMAP.md)。每次开工先读它顶部「🎯 当前阶段」区块。**

- **当前阶段**:P0 · 打磨内核 + UX(玄学引擎个人化 + UI/UX/操作逻辑优化)
- **铁律**:钱只花在已验证的假设上,每阶段间有 Gate;玄学永不背"准确率"的锅,"不准"是校准燃料;价值必须独立于玄学准不准。

---

## 1. 产品定位

- **用户**:在抖音 / 小红书 / B 站做内容的创作者,想找最佳发布时机
- **核心循环**:八字 + 视频类型 + 当下时空 → 评分 → 推荐档期
- **基调**:专业感(传统术数 + 自研奇门排盘)+ 娱乐免责(底部统一 Disclaimer)
- **当前阶段**:验证期,无收费,本地无后端

## 2. 技术栈

- **框架**:React 19 + React Router 7 + TypeScript 5.7
- **构建 / 样式**:Vite 6 + Tailwind v4(`@theme` 在 `src/index.css`)
- **动画**:framer-motion 11(`useReducedMotion` 兜底,全应用贯穿)
- **3D 星盘**:three 0.184 + `@react-three/fiber@^9` + `@react-three/drei@^10`(WebGL 失败降级到 SVG)
- **命理**:lunar-typescript(农历 / 八字),奇门自研在 `src/domain/qimen/`
- **持久化**:localStorage,async API 接口预留未来后端
- **测试**:vitest 3(27 单元测试)
- **图像导出**:html-to-image(分享卡片)

## 3. 关键架构决策

- **八字唯一录入入口** = `LotusOnboarding` 莲花拨号轮组件,两种模式:
  - `mode="onboarding"`(默认):`App.tsx` 检测 `baziInput===null` 时全屏渲染,无 Layout
  - `mode="edit"`:挂在 `/lotus` 路由,从已存八字 prefill,完成后 `navigate('/')`
- **`/bazi` 是命盘 Hub**,**不再录入八字**。结构:命主行 + 四柱速览 + 2×2 入口卡片(测这一条 / 排多期 / 看本月 / 看赛道)
- **首页星盘可点击** → 跳 `/lotus` 重排八字。星盘是真 3D 浑天仪(R3F),内嵌中央干支 / 分数 / 宿名信息
- **存储分层**:`src/storage/index.ts` 暴露 `loadBaZiInput / saveBaZiInput / saveHistory / loadHistory` 异步接口,底层 localStorage(key 前缀 `zmf:`)
- **评分纯前端**:无后端依赖,所有算法在 `src/domain/`
- **页面包壳**:`<Layout>` 提供 header + Stepper + BottomNav,只有 `LotusOnboarding`(onboarding 模式)旁路 Layout 直接全屏

## 4. 路由与用户动线

```
/               DashboardPage    首页(3D 星盘 + 下个吉时 + 内容风向 + 进入测算 CTA)
/lotus          LotusOnboarding  八字编辑(edit 模式,有返回 ×)
/bazi           BaZiPage         命盘 Hub(命主 + 四柱 + 4 入口)
/publish        PublishPage      发布信息(视频类型 + 平台 + 日期)
/result         ResultPage       测算结果(7 张面板)
/schedule       SchedulePage     多期排档(同类视频未来 14 天最佳)
/calendar       CalendarPage     本月吉日热力图
/talent         TalentPage       命定赛道排名
/me             MePage           命主卡 + 玻璃 row 列表(命盘/历史/帮助/协议)
/settings       SettingsPage     重排生辰 / 清空历史 / 通知占位 / 版本
/about          AboutPage        产品介绍 + 致谢 + 联系 + 免责声明
/privacy        PrivacyPage      隐私政策 / 用户协议(Tab 切换,?tab=terms|privacy)
```

- **首次打开**:无 baziInput → LotusOnboarding 全屏 → 入局 → `/`
- **重排八字**:首页星盘任意位置 click → `/lotus` → 重排 → 回 `/`
- **Stepper** 只在 `/bazi /publish /result` 显示;第一步叫 **「速览」** 不叫「八字」(因为 `/bazi` 已是 Hub,不再录入)

## 5. 设计语言 ★

V2 母题:**汝窑天青墨 × 朱砂金 × 石青石绿**。Token 在 `src/index.css @theme`,V1 别名(`gold / cinnabar / parchment / jade / ink`)同值映射保留(`ShareCard.tsx` 仍用别名,暂不可删)。

### Token 速查

| 色 | Tailwind class | 用途 |
|---|---|---|
| 汝窑天青 | `ru` / `ru-deep` / `ru-soft` | 底色 / 卡片下沉 / 卡片上浮 |
| 石青 | `shiqing` | 结构、输入框、Card 标题、控件、次要按钮 |
| 石绿 | `shilv` | **已完成 / 吉**(Stepper 已完成步、高分热力) |
| 朱砂 | `zhusha` / `zhusha-bright` | **当前 / 选中 / 警示**(底部 Tab、Stepper 当前步、单选选中态) |
| 金 | `jin` / `jin-bright` | **运势数据 / 分数 / 八字干 / 答案 headline** |
| 米白 | `mibai` | 主文字 |
| 青墨 | `qingmo` / `qingmo-mute` | 次文字 / 极弱辅文字(5:1 对比) |

### 法则(写代码必读)

- 默认只用 米白 + 青墨 做层级,**一屏最多 1 个强色块**(zhusha / jin 不可滥用)
- 数字字符串加 `.num` 或 `.tabular-nums`(等宽 JetBrains Mono / Sarasa Mono)
- 正文字体 Noto Serif SC(`font-serif-cn`);分享卡片栅格化用 `skipFonts`,回退系统宋体
- 卡片用 `.yu-card`(玉卡釉光多层阴影),Hero 卡片用 `.jin-gilt`(金箔描边)
- 入场动画交给 framer-motion;CSS 只做 `prefers-reduced-motion` 兜底

### 干支五行着色规则 ★

四柱干支字符颜色必须跟随其五行，不得用固定色覆盖五行语义：

- 使用 `WU_XING_COLOR`（`src/domain/wuxing.ts`）通过 inline `style={{ color }}` 赋色
- 天干用 `p.ganWuXing`，地支用 `p.zhiWuXing`（`Pillar` 类型已含此字段，无需额外计算）
- **禁止**在四柱展示中用 `text-jin-bright` / `text-mibai` 等固定 class 覆盖

| 五行 | Hex | 视觉语义 |
|------|-----|---------|
| 木 | `#5a8a6a` | 石绿 |
| 火 | `#b23a2e` | 朱砂红 |
| 土 | `#c8a45c` | 土黄金 |
| 金 | `#d8d4c8` | 铅白银 |
| 水 | `#4a6b8a` | 石青蓝 |

## 6. 命理算法位置

- **`src/domain/bazi/`** — `computeBaZi(input)` 排八字盘,基于 `lunar-typescript`。导出 `BaZiInput` / `BaZiChart` 类型
- **`src/domain/scoring/`** — 评分引擎,导出 `getQiMen`(奇门记忆化)、`videoAffinityScore`、`computeDailyFortune`、`computeCalendar`、`computeSchedule`、`scoreGrade`
- **`src/domain/qimen/`** — 奇门遁甲排盘,**自研**。基于《神奇之门 - 张志春》两案例校验:JU_TABLE / 三奇六仪 / 定局 / 值符值使 / 天盘九星转盘 / 八神 都已通过。**八门值使沿九宫数序 1→2→…→9→1 移动(不是洛书轨迹),阳顺阴逆** — 这是修过的坑,改动须保留
- **`src/domain/domain.test.ts`** 的 27 个 vitest 测试是 **ground truth**。改 domain 前先看测试

## 7. 文件组织

```
src/
  App.tsx                       路由 + 首启守卫(无八字 → LotusOnboarding)
  state/AppState.tsx            baziInput / publishInfo Context + ready flag
  storage/index.ts              localStorage 异步接口
  pages/                        9 个页面组件
  components/
    Layout.tsx                  header + Stepper + BottomNav 包壳
    BottomNav.tsx Stepper.tsx   ui.tsx
    RowLink.tsx                 玻璃 row 组件(/me /settings 复用,含 RowGroup 分组)
    onboarding/LotusOnboarding  莲花拨号轮(onboarding / edit 两态)
    decor/                      装饰:TianwenChart(R3F 3D), TianwenChartSvg(fallback),
                                TianwenHero, RemoteMountains, FortuneScene, ...
  domain/                       算法层(见 §6)
  data/                         videoTypes / ganzhi / scoringConfig / platforms 静态数据
  motion/                       Stagger / PageTransition / transitions
  util.ts types.ts
```

## 8. 验证基线

```bash
npx tsc --noEmit              # 类型干净
npx vitest run                # 27 / 27 必须通过
npx vite build                # JS gzip ~493 KB(含 three.js),CSS gzip ~7.6 KB
npm run dev                   # 默认 http://localhost:5173
```

走查清单(浏览器或 Playwright):

1. 清 localStorage → 首启莲花 → 入局 → 落首页
2. 首页星盘任意位置可点击 → `/lotus`(edit 模式,prefill 已存八字,右上 × 返回)
3. 首页只剩 1 个金色 CTA「进入测算」 → `/bazi`(Hub)
4. `/bazi` 顶部「命主」行 + 四柱 + 2×2 入口,4 个入口各自跳 `/publish /schedule /calendar /talent`
5. `reduced-motion` / WebGL 失败时 → SVG fallback 静态展示

### Screenshot-Implement 截图验证循环 ★

UI 变更（颜色、布局、新组件）必须走此流程，不可仅靠类型检查判定视觉达标：

```
1. npm run dev（http://localhost:5173）
2. 用 /webapp-testing skill 注入 localStorage 八字数据 → 截图目标页
3. 分析截图：颜色语义 / 布局偏移 / 对比度 / 文案截断
4. 若有偏差 → 修改代码 → 再截图对比
5. 直到视觉符合设计意图，再跑 tsc + vitest 确认无回归
```

**注入示例八字**（zmf:bazi key）：
```python
page.evaluate("""
    localStorage.setItem('zmf:bazi', JSON.stringify({
        year: 1990, month: 5, day: 15, shiChenIndex: 3, gender: "男"
    }));
""")
page.goto("http://localhost:5173/bazi")
page.wait_for_load_state("networkidle")
```

## 9. 注意事项 ★

- **永远不要动 `src/domain/`** 算法,除非有对应测试。27 个 vitest 是地基
- **色彩语义优先于个人审美**:不要拿 `zhusha-bright` 当装饰色,它专属「当前 / 选中 / 警示」
- **八字编辑只能走 `/lotus`**,不要在 `/bazi` 或其他页加 input(用户明确决策:全应用只有一个入口)
- **新增 R3F 组件必须有 fallback**:参考 `TianwenChart` 的 `onError` 切到 `TianwenChartSvgFallback`
- **LocalStorage key 命名**:`zmf:` 前缀(`zmf:bazi`、`zmf:history`)
- **npm cache 权限坑**:本机 `~/.npm/_cacache` 可能有 root-owned 文件,装包加 `--cache /tmp/npm-cache-fortune --legacy-peer-deps`
- **R3F + React 19 兼容**:必须 `@react-three/fiber@^9` + `@react-three/drei@^10`,旧版会报 peer 冲突
- **Stepper 第一步是「速览」不是「八字」**(`src/components/Stepper.tsx`),改路由文案要同步
- **Disclaimer 不可移除**:`Layout` 自动加在主流程,娱乐免责声明是产品基调一部分
- **iOS safe-area**:全屏组件用 `pt-[env(safe-area-inset-top)]` / `pb-[env(safe-area-inset-bottom)]`;Layout 内的页面不需要自己处理
- **奇门典籍参考**:用户 Obsidian 仓库 `~/Documents/minghefu-vault/08-资料库/典籍库/子部/神奇之门-张志春.md` 含两个完整排盘案例
- **微信小程序适配位**:`/me` 顶部命主圆是占位头像位(未来注入 wx.getUserInfo);分享按钮 H5 用 `navigator.share`/复制链接降级,小程序版接 wx.shareAppMessage;通知用 wx.requestSubscribeMessage。三页 `/settings /about /privacy` 用于小程序审核合规
- **协议文本占位**:`PrivacyPage.tsx` 中 `PRIVACY_BODY` / `TERMS_BODY` 为占位文本,上线前须法务复核
