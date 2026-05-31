# Codex Handoff · 玄机 · 发布择时

> 详细交接文档,补 `AGENTS.md` 概览之外的细节。
> 接手前先读 `AGENTS.md`(项目首读),再读本文。

最后更新:2026-05-31。

**协作模式**:Claude Code + Codex 同时协作。Codex 负责落地实施(写代码 / 跑测试 / 部署),
Claude Code 负责架构 / 设计 / UX 决策。`.claude/settings.local.json` 共享(tracked in git),
两个 Agent 用同一份权限白名单。

---

## 1. 项目当前能力清单

### 用户可见功能

| 模块 | 状态 | 备注 |
|---|---|---|
| 莲花拨号轮录入八字 | ✅ 完成 | 5 列拨号:年/月/日/时辰/性别;拨动有触感反馈(震动 + Web Audio 木质 tock);默认 2000/01/01 午时 女;选中时辰下方显示「子时 23:00–01:00」时间范围 |
| 命盘 Hub `/bazi` | ✅ 完成 | 命主 + 四柱(干支按五行配色)+ 2×2 入口卡片 |
| 首页 Dashboard | ✅ 完成 | 3D 浑天仪 hero(R3F + SVG fallback)+ 下个吉时(可展开 12 时辰)+ **我的赛道**(自选记忆)+ 今日内容风向(五行契合榜)+ CTA |
| 「我的赛道」自选 | ✅ 完成 | 底部 sheet(React Portal),最多 3 个赛道 + 主用平台;持久化 `zmf:tracks`;空态 / 已选 / 管理 三态 |
| 测算流程 `/publish → /result` | ✅ 完成 | 选视频类型(17 类)+ 平台(6 个)+ 日期 → MysticLoader 主题加载(推演中…)→ 结果 Hero + 12 时辰 + 锁后 7 张面板 |
| MysticLoader 主题加载 | ✅ 完成 | 推演中文案 + jin 流光条 + 三段术数文案(排八字时柱…起奇门时局…演算十二时辰…);最短显示 600ms 保仪式感 |
| 多期排档 `/schedule` | ✅ 完成 | 未来 14 天同类视频最佳档期 |
| 月历热力图 `/calendar` | ✅ 完成 | 本月吉日热力;未邀请码用户仅本周可见;cell 入场只 opacity 淡入,无 scale ripple |
| 命定赛道排名 `/talent` | ✅ 完成 | 八字 vs 各赛道五行契合度排序 |
| 我的页 `/me` | ✅ 完成 | 命主圆 + 命盘 / 历史 / 联系微信 / 关于 / 协议 row |
| 设置 `/settings` | ✅ 完成 | 重排生辰 / 我的赛道 / 邀请码 / 清空历史 / 重置所有数据 / 版本 |
| 邀请码解锁 | ✅ 完成 | 静态白名单(`src/features/invite/`),解锁后看完整 7 张面板 + 全月日历 + 全部赛道 |
| 联系作者 / 加微信 | ✅ 完成 | 弹窗显示 QR + 可复制微信号,埋 `contact_wechat_view / copy` 事件 |
| 隐私 / 协议 `/privacy` | ✅ 占位文本 | `PRIVACY_BODY / TERMS_BODY` 为占位,**上线前须法务复核** |
| 分享卡片 | ✅ 完成 | html-to-image 栅格化;部分 Android 字体回退不完美 |
| 时辰统一显示时间范围 | ✅ 完成 | 所有显示时辰处都带「23:00–01:00」格式 |
| PWA(可加到主屏幕) | ✅ 完成 | Workbox 生成 SW,manifest 在 `public/`,iOS standalone 模式正常 |
| PostHog 埋点 | ✅ 完成 | 8 个 funnel 事件(`bazi_submit / daily_lookup / publish_calc / share_attempt / preferred_tracks_set` 等),同意流接 GDPR-friendly |
| GitHub Pages 自动部署 | ✅ 完成 | push main 触发,~1 分钟 |
| iOS Safari "添加到主屏幕" | ✅ 完成 | manifest / icon 路径已修(`%BASE_URL%`),standalone 模式不白屏 |

### 算法能力

- ✅ 八字排盘(`lunar-typescript`)
- ✅ 黄历 + 二十八宿 + 传播气场(自研文案库)
- ✅ 奇门遁甲(自研:拆补法定局 + 转盘法,张志春《神奇之门》两例案校验通过)
- ✅ 评分引擎(四维加权,平台 12 时辰流量曲线)

---

## 2. 已验证内容

### 自动验证(每次改动必跑)

```bash
npx tsc --noEmit       # 0 错(类型干净)
npm test               # 76/76 过
npm run build          # 成功,JS gzip ~493 KB,CSS gzip ~7.6 KB
```

### 测试分布

```
tests/static/         (2 个 + 6 个) 静态构建产物(bundle 体积 / index.html 元信息)
src/domain/           27 个 ground truth(八字 / 黄历 / 奇门 / 评分)
src/storage/          7 个(load/save/clear + 注入容错)
src/state/            4 个 AppState Context
src/analytics/        2 个 track + 3 个 consent
src/data/             7 个 resultDisplay
src/features/invite/  7 个邀请码白名单
src/platform/         4 个 session
src/components/onboarding/  7 个 LotusOnboarding
合计 76 / 76 passing
```

### 手动 / 截图回归验证(已跑过的)

- 清 localStorage → 首启莲花 → 默认 2000/01/01 午时 女 → 入局 → 落首页
- Dashboard 五处 UX:我的赛道空态 → sheet → 选 2 赛道 → 卡内显示;下个吉时展开 12 时辰带 ▶ 高亮;MysticLoader 三段文案;时辰范围全显示;设置「首页偏好/我的赛道」入口
- 月历 cell 进场无脉动(只 opacity 淡入)
- iOS Safari Add-to-Home-Screen 后正常打开(非白屏)

### 奇门已校验的两个排盘案例

均在 `src/domain/domain.test.ts`:
- JU_TABLE 节气阴阳遁定局
- 三奇六仪填地盘
- 值符 / 值使 起转
- 天盘九星沿洛书随值符旋转
- 八门值使沿九宫数序 1→2→…→9→1 移动,阳顺阴逆
- 八神阴阳遁排序

---

## 3. 已知风险

### 算法层

- 🟡 **节气交界精度**:lunar-typescript 的节气计算在切换日(立春/惊蛰等)±数小时精度可能不够。当前奇门测试覆盖不够,改进建议见 §4.1
- 🟡 **奇门评分粗糙**:DOOR_SCORE / STAR_SCORE / GOD_SCORE 是经验值,未来可基于实际案例调整
- 🟢 **平台流量曲线**:`PLATFORM_PROFILES.hourScores` 是估算值,未基于真实流量数据。改进需要平台 API 或第三方数据

### 工程层

- 🟢 **`.claude/settings.local.json` 有意保持 tracked**:用于 Claude Code + Codex 双 Agent 协作时共享权限白名单(2026-05-31 决策)。修改时注意不要塞机密信息(只放工具调用 allowlist)
- 🟡 **PostHog key 暴露在前端 bundle**:这是 PostHog 本身的设计(client-side SDK 必须暴露 project key),用 PostHog "Project API key" 而非 "Personal API key" 是安全的,但仍建议在 PostHog Dashboard 设置 URL allowlist
- 🟡 **HashRouter 限制**:URL 不够好看(`/#/calendar`)、SSR 不可能、SEO 不友好。当前为 GitHub Pages 子路径妥协。换 Vercel + BrowserRouter 需同步改 `vercel.json` rewrites
- 🟢 **bundle 体积**:JS gzip 493 KB,主要来自 three.js / R3F(浑天仪 hero 用)。可考虑首屏先加载 SVG fallback,R3F 按需加载

### 产品层

- 🔴 **隐私政策 / 用户协议为占位文本**(`PrivacyPage.tsx` `PRIVACY_BODY / TERMS_BODY`),**正式上线前必须法务复核**
- 🟡 **微信小程序版本未启动**:`src/platform/` 已埋接口桩,但 R3F 浑天仪在小程序不支持,需大改 hero
- 🟡 **付费墙是邀请码白名单**(`src/features/invite/`),未接支付。商业化需先接收银 SDK

### 测试覆盖

- 🟡 **Playwright E2E 缺失**:目前只有 vitest 单元 + 组件测试,完整用户流(/lotus → /bazi → /publish → /result → 分享卡片)无端到端测试
- 🟢 **可访问性**:有 aria-label 但未系统跑过 a11y 审计

---

## 4. 未来优化建议

### 4.1 算法 / 数据(高优)

1. **奇门节气交界测试加强**:对立春 / 惊蛰 / 立夏等关键节气切换日 ±1 天 ±2 时辰各排一组人工核验排盘,补 ~10 个测试到 `src/domain/domain.test.ts`
2. **平台流量曲线校准**:接 PostHog 或第三方流量数据,调整 `PLATFORM_PROFILES.hourScores`
3. **更多视频类型 / 平台**:`src/data/videoTypes.ts` 加品类即可,无算法依赖

### 4.2 工程(中)

1. **后端 + 跨设备同步**:`src/storage/index.ts` 已 async,改 fetch 即可。推荐 Supabase(用户登录免费 50k)
2. **R3F 按需加载**:首屏先 SVG,用户进 hero 视野再 lazy 加载 R3F bundle
3. **Vercel 切换**:从 GitHub Pages 转 Vercel(`vercel.json` 已配),换 BrowserRouter,URL 更友好

### 4.3 UX / 视觉(中)

1. **分享卡片 SSR 出图**:html-to-image 在 Android 字体回退不完美。考虑用 Vercel OG Image / Satori 后端出图
2. **暗黑/亮色主题**:当前全暗主题,白天阅读对比不够;预留 `@theme` 切换位
3. **首页 hero 性能**:浑天仪是 R3F 重组件,部分老设备掉帧;可加 perf budget 自动降级 SVG

### 4.4 商业化(低,等 Web 验证完)

1. **付费墙接支付**:邀请码 → Apple Pay / WeChat Pay / Stripe
2. **微信小程序版本**:`src/platform/` 接口已埋,但需重写 hero
3. **创作者会员体系**:看测算次数 / 多账号八字 / 团队协作

---

## 5. GitHub 内测上传前检查清单

每次 push main 前过一遍:

- [ ] `npm test` 全过(76/76)
- [ ] `npm run build` 成功,gzip 体积无异常增长
- [ ] `git status` 干净,无意外的 modified
- [ ] 改 UI 跑过 Screenshot 回归(至少 dashboard + result 两屏)
- [ ] 改奇门 / 评分必跑 `npm test`
- [ ] 未把 `.env.local` / `dist/` / `node_modules/` / `.codegraph/` / `.claude/settings.local.json` 加入 commit
- [ ] commit message 用 conventional commits(`feat(...)` / `fix(...)` / `chore(...)`)
- [ ] PR 描述说清楚改动 + 验证步骤

push 后 `gh run list --limit 3` 看 GitHub Pages 部署是否 success,~1 分钟完成。

---

## 6. 环境变量说明

唯一一个变量:`VITE_POSTHOG_KEY`。

| 文件 / 位置 | 用途 |
|---|---|
| `.env.example`(已提交) | 模板,告诉接手人怎么填 |
| `.env.local`(已 .gitignore,**不要提交**) | 本机 dev 用,可选;缺失只影响埋点 |
| GitHub Actions Secret `VITE_POSTHOG_KEY` | GitHub Pages 构建注入,见 `.github/workflows/deploy.yml` |
| Vercel Environment Variables(如启用 Vercel) | 在 Vercel Dashboard → Project Settings → Environment Variables 添加 |

**获取方式**:https://posthog.com → Project Settings → Project API key(phc_ 开头)。注册时选 US region(代码 hardcode `us.i.posthog.com`)。

**缺失行为**:不报错,埋点静默丢弃。dev 模式 console 会有一次 warn。

---

## 7. 部署说明

### 7.1 GitHub Pages(当前生产)

- 配置文件:`.github/workflows/deploy.yml`
- 触发:push 到 `main` 分支
- 流程:`npm ci --legacy-peer-deps` → `npm run build` → upload `dist/` → deploy
- URL:`https://jzhang7-art.github.io/yuanji-fortune/`
- 耗时:~50 秒
- base 路径:`/yuanji-fortune/`(`vite.config.ts: BASE`)
- PostHog key:`secrets.VITE_POSTHOG_KEY`

**首次启用 GitHub Pages**:Repo Settings → Pages → Source: GitHub Actions(已开启)

### 7.2 Vercel(备用,未启用)

- 配置文件:`vercel.json`
- 已配:framework=vite, buildCommand, installCommand=`npm install --legacy-peer-deps`
- rewrites:SPA 路由全部回退到 `/index.html`,放行 api/assets/icons/sw/manifest
- 缓存头:`/sw.js` no-cache、`/assets/(.*)` 1 年 immutable
- **启用步骤**:Vercel Dashboard → Add New Project → Import Git Repo → 自动识别 vercel.json → 在 Environment Variables 加 `VITE_POSTHOG_KEY`
- 启用后建议改 vite base 为 `/`(去掉 `/yuanji-fortune/` 子路径)+ 改 HashRouter 为 BrowserRouter,URL 更干净。这是改动较大的事,做之前先开一个 feature branch

### 7.3 本地预览生产构建

```bash
npm run build
npm run preview     # 默认 http://localhost:4173/yuanji-fortune/
```

### 7.4 PWA 注意事项

- `vite-plugin-pwa` 用 `generateSW` 策略,registerType=`autoUpdate`(新版本会自动激活)
- `navigateFallback: ${BASE}index.html`,SPA 任意路由都能离线打开 index
- iOS Safari "添加到主屏幕" 在 standalone 模式下能正常打开(需 manifest / icon 路径正确,已修)
- 用户更新 PWA 需要关闭再打开 app(SW autoUpdate 在下次 launch 生效)

---

## 8. 接手第一周建议路径

1. **Day 1**:克隆仓库 → `npm install --legacy-peer-deps` → 复制 `.env.example` 到 `.env.local`(可暂时空)→ `npm run dev` → 打开 `http://localhost:5173/yuanji-fortune/` → 走一遍 §1 能力清单熟悉产品
2. **Day 2**:跑 `npm test` 全过 → 读 `src/domain/domain.test.ts` 27 个测试 + `src/domain/qimen/index.ts` 了解奇门算法 → 把 `src/domain/scoring/index.ts` 的 `computeForecast` 调用链画一遍
3. **Day 3**:跑 `npm run build` → 看 dist 体积分布 → 如有性能优化想法,从 R3F lazy load / SW cache 策略入手
4. **Day 4-5**:从 §4 优化建议挑一个最小 ROI 高的(推荐 #4.1.1 节气交界测试),做一个小 PR 走通完整流程(改 + test + build + commit + push + 看 GitHub Pages 部署)

---

## 9. 联系方式

- 仓库:`https://github.com/jzhang7-art/yuanji-fortune`
- 生产:`https://jzhang7-art.github.io/yuanji-fortune/`
- 原作者:见 git log
- 项目内联系入口:`/me → 联系作者 · 加微信`
