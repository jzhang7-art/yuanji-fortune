import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { track } from '@/analytics/track'
import { useAppState } from '@/state/AppState'
import { useBaZiChart } from '@/hooks/useBaZiChart'
import { computeDailyFortune, computeForecast, scoreGrade } from '@/domain/scoring'
import { PLATFORMS } from '@/data/scoringConfig'
import { TianwenHeroLazy as TianwenHero } from '@/components/decor/TianwenHero.lazy'
import { AuroraBg } from '@/components/decor/AuroraBg'
import { SkyDome28Xiu } from '@/components/decor/SkyDome28Xiu'
import { FortuneDial } from '@/components/decor/FortuneDial'
import { Card, ElementBadge, ScoreBar } from '@/components/ui'
import { StaggerList, StaggerItem } from '@/motion/Stagger'
import { spring } from '@/motion/transitions'
import { getVideoType, type VideoType } from '@/data/videoTypes'
import { formatDate, toYmd } from '@/util'
import { hasSession, setSession } from '@/platform/session'
import {
  loadPreferredTracks,
  savePreferredTracks,
  type PreferredTracks,
} from '@/storage'
import { TrackPickerSheet } from '@/components/TrackPickerSheet'
import { MysticLoader } from '@/components/loading/MysticLoader'

type HeroTone = 'gold' | 'parchment' | 'cinnabar'

function heroToneOf(tone: string): HeroTone {
  if (tone === 'gold' || tone === 'jade') return 'gold'
  if (tone === 'cinnabar') return 'cinnabar'
  return 'parchment'
}

interface MyTrackScore {
  video: VideoType
  score: number
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { baziInput, ready, setPublishInfo } = useAppState()
  const chart = useBaZiChart()

  const [preferred, setPreferred] = useState<PreferredTracks | null>(null)
  const [preferredLoaded, setPreferredLoaded] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [hoursOpen, setHoursOpen] = useState(false)
  const [myTracks, setMyTracks] = useState<MyTrackScore[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadPreferredTracks().then((p) => {
      if (cancelled) return
      setPreferred(p)
      setPreferredLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const effectivePlatform = preferred?.platform ?? PLATFORMS[0]

  const fortune = useMemo(() => {
    if (!chart) return null
    return computeDailyFortune(chart, toYmd(new Date()), effectivePlatform)
  }, [chart, effectivePlatform])

  // 「我的赛道」分数:1-3 个 computeForecast 真口径,deferred 不阻塞首屏
  useEffect(() => {
    if (!chart || !preferred || preferred.trackIds.length === 0) {
      setMyTracks(null)
      return
    }
    let cancelled = false
    const today = toYmd(new Date())
    const raf = requestAnimationFrame(() => {
      const scores = preferred.trackIds
        .map((id) => {
          const video = getVideoType(id)
          if (!video) return null
          const fc = computeForecast(chart, video, today, effectivePlatform)
          return { video, score: fc.target.overall } as MyTrackScore
        })
        .filter((x): x is MyTrackScore => x !== null)
      if (!cancelled) setMyTracks(scores)
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [chart, preferred, effectivePlatform])

  // 同一天首次进入:完整 1.8s 揭示仪式;同日再次进入:压缩 50%
  const sessionKey = `dash-hero-${toYmd(new Date())}`
  const isRevisit = hasSession(sessionKey)
  const compress = isRevisit ? 0.5 : 1
  const d = (t: number) => t * compress
  useEffect(() => {
    setSession(sessionKey, '1')
  }, [sessionKey])

  useEffect(() => {
    if (chart) track('daily_lookup')
  }, [chart])

  function handleSavePreferred(next: PreferredTracks) {
    setPreferred(next)
    void savePreferredTracks(next)
    track('preferred_tracks_set', { count: next.trackIds.length, platform: next.platform })
  }

  if (!ready) {
    return <MysticLoader variant="compact" />
  }

  if (!baziInput) {
    return (
      <StaggerList className="flex flex-col gap-4">
        <StaggerItem>
          <Card className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-jin/40 text-2xl text-jin-bright">
              玄
            </span>
            <h1 className="text-lg font-semibold text-mibai">玄机 · 发布择时</h1>
            <p className="text-sm leading-relaxed text-qingmo">
              录入你的生辰八字，每天为你推演创作天时、
              <br />
              最佳发布时辰与吉日。
            </p>
            <Link
              to="/bazi"
              className="mt-2 cursor-pointer rounded-xl bg-gradient-to-b from-jin-bright to-jin px-8 py-3 text-base font-semibold text-ru shadow-lg shadow-jin/20 transition hover:brightness-105 active:scale-[0.98]"
            >
              录入生辰八字
            </Link>
          </Card>
        </StaggerItem>
      </StaggerList>
    )
  }

  if (!fortune) {
    return <MysticLoader variant="compact" />
  }

  const now = new Date()
  const curShiChen = Math.floor(((now.getHours() + 1) % 24) / 2)
  const upcoming = fortune.hours.filter((h) => h.shiChenIndex > curShiChen)
  const tomorrow = upcoming.length === 0
  const nextHour = [...(upcoming.length > 0 ? upcoming : fortune.hours)].sort(
    (a, b) => b.score - a.score,
  )[0]

  const goodTypes = fortune.typeRanking.slice(0, 3)
  const slowType = fortune.typeRanking[fortune.typeRanking.length - 1]

  const grade = scoreGrade(fortune.dayScore)
  const heroTone = heroToneOf(grade.tone)
  const [verdictMain, verdictSub] = grade.label.split(/\s*·\s*/)

  // 快测:从首页风向行点视频类型 → 用今日 + 用户主平台 → 直接出结果
  function quickTest(videoTypeId: string) {
    setPublishInfo({
      videoTypeId,
      title: '',
      platform: effectivePlatform,
      targetDate: toYmd(new Date()),
    })
    navigate('/result')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 日期 + 干支 */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: d(0.1) }}
      >
        <p className="text-sm text-qingmo">
          {formatDate(fortune.date)} · {fortune.dayGanZhi}日
        </p>
      </motion.div>

      {/* 今日创作天时 Hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: d(0.2) }}
      >
        <motion.button
          type="button"
          onClick={() => navigate('/lotus')}
          whileTap={{ scale: 0.985 }}
          aria-label="重排生辰八字"
          className="block w-full cursor-pointer rounded-3xl text-left"
        >
          <div className="jin-gilt relative overflow-hidden rounded-3xl border border-jin/25 bg-ru-soft">
            <AuroraBg />
            <SkyDome28Xiu />
            <TianwenHero
              dayGanZhi={fortune.dayGanZhi}
              verdict={verdictMain}
              subVerdict={verdictSub}
              tone={heroTone}
              score={fortune.dayScore}
              xiuName={fortune.huangli.xiu}
              delay={d(0.2)}
              transparent
              bareInner
              hideChart
            />
          </div>
        </motion.button>
        <p className="mt-2 text-center text-[11px] tracking-[0.28em] text-qingmo-mute">
          · 轻 触 星 盘 · 重 排 生 辰 八 字 ·
        </p>
        <motion.p
          className="mt-3 text-center text-sm leading-relaxed text-qingmo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: d(1.15) }}
        >
          {fortune.huangli.qiChang.reading}
        </motion.p>
      </motion.div>

      {/* 下个吉时 (可展开 12 时辰) */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: d(1.1) }}
      >
        <Card title="下个吉时" subtitle={tomorrow ? '今日时段已尽' : '今日剩余时段'}>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-ru-deep p-3">
            <div className="flex-1">
              <div className="text-xl font-semibold text-jin-bright">
                {tomorrow ? '明日 ' : ''}
                {nextHour.name} {nextHour.range}
              </div>
              <span className="text-xs text-qingmo">该时辰发布指数</span>
            </div>
            <FortuneDial value={nextHour.score} size={88} stroke={6} label="指数" />
          </div>

          <button
            type="button"
            onClick={() => setHoursOpen((v) => !v)}
            aria-expanded={hoursOpen}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg py-2 text-xs text-shiqing transition-colors hover:bg-shiqing/8"
          >
            {hoursOpen ? '收起 12 时辰' : '展开 12 时辰'}
            <motion.span
              aria-hidden
              animate={{ rotate: hoursOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ▾
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {hoursOpen && (
              <motion.div
                key="hours"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-2 flex flex-col gap-2 pt-2">
                  {fortune.hours.map((h, i) => {
                    const isCur = h.shiChenIndex === curShiChen
                    return (
                      <div key={h.shiChenIndex} className="flex items-center gap-2">
                        <span
                          className={`w-3 shrink-0 text-center text-xs ${
                            isCur ? 'text-zhusha-bright' : 'text-transparent'
                          }`}
                          aria-hidden
                        >
                          ▶
                        </span>
                        <span
                          className={`w-10 shrink-0 text-xs ${
                            isCur ? 'font-semibold text-zhusha-bright' : 'text-qingmo'
                          }`}
                        >
                          {h.name}
                        </span>
                        <span className="w-20 shrink-0 text-[10px] tabular-nums text-qingmo-mute">
                          {h.range}
                        </span>
                        <div className="flex-1">
                          <ScoreBar value={h.score} delay={0.04 + i * 0.03} />
                        </div>
                        <span className="w-8 shrink-0 text-right text-xs tabular-nums text-mibai">
                          {h.score}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* 我的赛道 (Card B 位置) */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: d(1.2) }}
      >
        <MyTracksCard
          preferred={preferred}
          preferredLoaded={preferredLoaded}
          myTracks={myTracks}
          onOpenPicker={() => setSheetOpen(true)}
          onClickRow={quickTest}
        />
      </motion.div>

      {/* 今日内容风向 (赛道气场榜,platform 无关) */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: d(1.3) }}
      >
        <Card title="今日内容风向" subtitle="赛道气场榜 · 点击详测">
          <p className="mb-2 text-xs text-qingmo">宜发 · 顺势之选</p>
          <div className="flex flex-col gap-1.5">
            {goodTypes.map((t, i) => (
              <motion.div
                key={t.video.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: d(1.5 + i * 0.06) }}
              >
                <TypeRow
                  video={t.video}
                  score={t.score}
                  tone="good"
                  onClick={() => quickTest(t.video.id)}
                />
              </motion.div>
            ))}
          </div>
          <p className="mb-2 mt-3 text-xs text-qingmo">缓发 · 今日气弱</p>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: d(1.5 + goodTypes.length * 0.06) }}
          >
            <TypeRow
              video={slowType.video}
              score={slowType.score}
              tone="slow"
              onClick={() => quickTest(slowType.video.id)}
            />
          </motion.div>
        </Card>
      </motion.div>

      {/* 唯一 CTA - 进入测算 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: d(1.7) }}
      >
        <Link
          to="/bazi"
          className="block cursor-pointer rounded-2xl bg-gradient-to-b from-jin-bright to-jin py-4 text-center text-base font-semibold tracking-[0.3em] text-ru shadow-lg shadow-jin/20 transition hover:brightness-105 active:scale-[0.98]"
        >
          进 入 测 算
        </Link>
      </motion.div>

      <TrackPickerSheet
        open={sheetOpen}
        initial={preferred}
        onClose={() => setSheetOpen(false)}
        onSave={handleSavePreferred}
      />
    </div>
  )
}

function MyTracksCard({
  preferred,
  preferredLoaded,
  myTracks,
  onOpenPicker,
  onClickRow,
}: {
  preferred: PreferredTracks | null
  preferredLoaded: boolean
  myTracks: MyTrackScore[] | null
  onOpenPicker: () => void
  onClickRow: (videoTypeId: string) => void
}) {
  // 未加载完前不显示卡(避免空态闪一下)
  if (!preferredLoaded) {
    return (
      <Card title="我的赛道" subtitle="按你的主平台算">
        <div className="py-3 text-center text-xs text-qingmo-mute">载入中…</div>
      </Card>
    )
  }

  if (!preferred || preferred.trackIds.length === 0) {
    return (
      <Card title="我的赛道" subtitle="一眼看自己赛道">
        <div className="flex flex-col items-center gap-3 py-3 text-center">
          <p className="text-sm text-qingmo">还没选呢</p>
          <button
            type="button"
            onClick={onOpenPicker}
            className="cursor-pointer rounded-xl border border-zhusha-bright/60 px-5 py-2 text-sm text-zhusha-bright transition hover:bg-zhusha-bright/10 active:scale-[0.98]"
          >
            选你的赛道 →
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <header className="mb-3 flex items-baseline gap-2">
        <span className="h-4 w-1 rounded-full bg-shiqing" />
        <h2 className="text-base font-semibold tracking-wide text-mibai">我的赛道</h2>
        <span className="text-xs text-qingmo">
          {preferred.platform} · 综合分
        </span>
        <button
          type="button"
          onClick={onOpenPicker}
          className="ml-auto cursor-pointer text-xs text-shiqing transition-colors hover:text-jin-bright"
        >
          管理 ›
        </button>
      </header>
      <div className="flex flex-col gap-1.5">
        {myTracks === null ? (
          <div className="py-2 text-center text-xs text-qingmo-mute">推演中…</div>
        ) : (
          myTracks.map((t) => (
            <TypeRow
              key={t.video.id}
              video={t.video}
              score={t.score}
              tone={t.score >= 60 ? 'good' : 'slow'}
              onClick={() => onClickRow(t.video.id)}
            />
          ))
        )}
      </div>
    </Card>
  )
}

function TypeRow({
  video,
  score,
  tone,
  onClick,
}: {
  video: VideoType
  score: number
  tone: 'good' | 'slow'
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      whileHover={{ x: 2 }}
      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-shiqing/8"
    >
      <span className="text-xl" aria-hidden>
        {video.icon}
      </span>
      <span className="text-sm text-mibai">{video.name}</span>
      <span className="flex gap-0.5">
        {video.elements.map((e) => (
          <ElementBadge key={e} element={e} size="sm" />
        ))}
      </span>
      <span
        className={`ml-auto text-sm font-semibold tabular-nums ${
          tone === 'good' ? 'text-shilv' : 'text-zhusha-bright'
        }`}
      >
        {score}
      </span>
      <span aria-hidden className="text-xs text-qingmo-mute">
        ›
      </span>
    </motion.button>
  )
}

