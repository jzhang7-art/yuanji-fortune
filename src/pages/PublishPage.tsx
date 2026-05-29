import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppState } from '@/state/AppState'
import { useBaZiChart } from '@/hooks/useBaZiChart'
import type { BaZiChart } from '@/domain/bazi'
import { VIDEO_TYPES } from '@/data/videoTypes'
import { getPlatformProfile, PLATFORMS } from '@/data/scoringConfig'
import { ElementBadge, Card, Pill, PrimaryButton } from '@/components/ui'
import { StaggerList, StaggerItem } from '@/motion/Stagger'
import { spring } from '@/motion/transitions'
import { toYmd } from '@/util'

export function PublishPage() {
  const navigate = useNavigate()
  const { baziInput, publishInfo, setPublishInfo } = useAppState()

  // 用白名单兜底从 localStorage 或路由 state 读到的可疑值
  const initialVideoTypeId =
    publishInfo?.videoTypeId && VIDEO_TYPES.some((v) => v.id === publishInfo.videoTypeId)
      ? publishInfo.videoTypeId
      : ''
  const initialPlatform =
    publishInfo?.platform && (PLATFORMS as readonly string[]).includes(publishInfo.platform)
      ? publishInfo.platform
      : PLATFORMS[0]

  const [videoTypeId, setVideoTypeId] = useState(initialVideoTypeId)
  const [title, setTitle] = useState(publishInfo?.title ?? '')
  const [duration, setDuration] = useState(
    publishInfo?.durationSec ? String(publishInfo.durationSec) : '',
  )
  const [platform, setPlatform] = useState<string>(initialPlatform)
  const [targetDate, setTargetDate] = useState(publishInfo?.targetDate ?? toYmd(new Date()))

  const chart = useBaZiChart()

  if (!baziInput || !chart) {
    return <Redirect />
  }

  function handleSubmit() {
    // 白名单校验：防止 localStorage / URL 注入异常值绕过 UI
    if (!VIDEO_TYPES.some((v) => v.id === videoTypeId)) return
    if (!(PLATFORMS as readonly string[]).includes(platform)) return
    const durationNum = duration ? Number(duration) : undefined
    const safeDuration =
      durationNum && Number.isFinite(durationNum) && durationNum > 0 && durationNum < 36000
        ? durationNum
        : undefined
    setPublishInfo({
      videoTypeId,
      title: title.trim().slice(0, 200),
      durationSec: safeDuration,
      platform,
      targetDate,
    })
    navigate('/result')
  }

  return (
    <StaggerList className="flex flex-col gap-4">
      <StaggerItem>
        <BaZiSummary chart={chart} />
      </StaggerItem>

      <StaggerItem>
        <p className="text-center text-sm text-qingmo">选择视频类型并填写发布信息</p>
      </StaggerItem>

      <StaggerItem>
        <Card title="视频类型" subtitle="选择最贴近的一类">
          <StaggerList
            className="grid grid-cols-3 gap-2"
            delayChildren={0.1}
            staggerChildren={0.025}
          >
            {VIDEO_TYPES.map((vt) => {
              const active = vt.id === videoTypeId
              return (
                <StaggerItem key={vt.id}>
                  <motion.button
                    type="button"
                    onClick={() => setVideoTypeId(vt.id)}
                    aria-pressed={active}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex w-full cursor-pointer flex-col items-center gap-1 overflow-hidden rounded-xl border py-2.5 transition-colors ${
                      active
                        ? 'border-zhusha bg-zhusha/15'
                        : 'border-shiqing/15 bg-ru-deep hover:border-shiqing/40 active:bg-shiqing/8'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="videoTypeActive"
                        className="absolute inset-0 -z-10 rounded-xl bg-zhusha/15"
                        transition={spring}
                      />
                    )}
                    <span className="text-2xl" aria-hidden>
                      {vt.icon}
                    </span>
                    <span
                      className={`text-xs ${active ? 'text-zhusha-bright' : 'text-qingmo'}`}
                    >
                      {vt.name}
                    </span>
                    <span className="flex gap-0.5">
                      {vt.elements.map((e) => (
                        <ElementBadge key={e} element={e} size="sm" />
                      ))}
                    </span>
                  </motion.button>
                </StaggerItem>
              )
            })}
          </StaggerList>
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Card title="发布信息">
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm text-qingmo">视频标题（选填）</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：三招拍出电影感"
                className="w-full rounded-xl border border-shiqing/20 bg-ru-deep px-3 py-2.5 text-mibai transition-colors placeholder:text-qingmo/40 focus:border-shiqing/60"
              />
            </label>

            <div className="flex gap-3">
              <label className="block flex-1">
                <span className="mb-1.5 block text-sm text-qingmo">时长（秒，选填）</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="60"
                  className="w-full rounded-xl border border-shiqing/20 bg-ru-deep px-3 py-2.5 text-mibai transition-colors placeholder:text-qingmo/40 focus:border-shiqing/60"
                />
              </label>
              <label className="block flex-1">
                <span className="mb-1.5 block text-sm text-qingmo">发布平台</span>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-shiqing/20 bg-ru-deep px-3 py-2.5 text-mibai transition-colors focus:border-shiqing/60"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="-mt-1 text-xs leading-relaxed text-qingmo-mute">
              {platformHint(platform)}
            </p>

            <label className="block">
              <span className="mb-1.5 block text-sm text-qingmo">计划发布日期</span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl border border-shiqing/20 bg-ru-deep px-3 py-2.5 text-mibai transition-colors focus:border-shiqing/60"
              />
            </label>
          </div>
        </Card>
      </StaggerItem>

      <StaggerItem>
        <PrimaryButton onClick={handleSubmit} disabled={!videoTypeId}>
          开始推演 · 测算发布运势
        </PrimaryButton>
      </StaggerItem>
    </StaggerList>
  )
}

function platformHint(platform: string): string {
  const days = getPlatformProfile(platform).forecastDays
  if (days <= 1) return `${platform}多为日更，将为你推荐当日最佳发布时段。`
  if (days <= 2) return `${platform}更新较快，将为你推荐未来 ${days} 天发布吉日。`
  return `${platform}更新周期较长，将为你推荐未来一周发布吉日。`
}

/** 顶部八字速览折叠卡：折叠时一行带"展开/换八字"；展开时显示四柱 + 喜用 */
function BaZiSummary({ chart }: { chart: BaZiChart }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="yu-card rounded-2xl border border-shiqing/15 bg-ru-soft px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 shrink-0 rounded-full bg-jin" />
        <span className="text-xs text-qingmo">你的命盘</span>
        <span className="text-sm text-mibai">
          日主 <span className="font-semibold text-jin-bright">{chart.dayMaster}·{chart.dayMasterWuXing}</span>
        </span>
        <span className="text-xs text-qingmo">· 命局{chart.strength}</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="ml-auto -mr-1 inline-flex min-h-9 cursor-pointer items-center px-2 text-xs text-shiqing transition-colors hover:text-jin-bright"
        >
          {open ? '收起' : '展开'}
          <motion.span
            aria-hidden
            className="ml-0.5"
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ›
          </motion.span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="open"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[chart.year, chart.month, chart.day, chart.time].map((p) => (
                <div key={p.label} className="rounded-xl bg-ru-deep py-2 text-center">
                  <div className="text-[11px] text-qingmo">{p.label}</div>
                  <div className="text-base font-semibold text-jin-bright">{p.gan}</div>
                  <div className="text-base font-semibold text-mibai">{p.zhi}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-qingmo">喜用</span>
              {chart.favorable.map((e) => (
                <ElementBadge key={e} element={e} size="sm" />
              ))}
              <Pill tone="soft">命局{chart.strength}</Pill>
              <Link
                to="/bazi"
                className="ml-auto inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-shiqing/30 px-2.5 text-xs text-shiqing transition-colors hover:bg-shiqing/10"
              >
                重新录入
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function Redirect() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-qingmo">请先录入生辰八字</p>
      <button
        type="button"
        onClick={() => navigate('/bazi')}
        className="cursor-pointer rounded-xl border border-jin/40 px-6 py-2.5 text-jin-bright transition hover:bg-jin/10 active:scale-[0.98]"
      >
        去录入
      </button>
    </div>
  )
}
