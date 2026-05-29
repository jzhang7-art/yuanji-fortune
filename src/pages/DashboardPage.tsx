import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { track } from '@/analytics/track'
import { useAppState } from '@/state/AppState'
import { useBaZiChart } from '@/hooks/useBaZiChart'
import { computeDailyFortune, scoreGrade } from '@/domain/scoring'
import { PLATFORMS } from '@/data/scoringConfig'
import { TianwenHeroLazy as TianwenHero } from '@/components/decor/TianwenHero.lazy'
import { AuroraBg } from '@/components/decor/AuroraBg'
import { SkyDome28Xiu } from '@/components/decor/SkyDome28Xiu'
import { FortuneDial } from '@/components/decor/FortuneDial'
import { Card, ElementBadge } from '@/components/ui'
import { StaggerList, StaggerItem } from '@/motion/Stagger'
import { spring } from '@/motion/transitions'
import type { VideoType } from '@/data/videoTypes'
import { formatDate, toYmd } from '@/util'
import { hasSession, setSession } from '@/platform/session'

type HeroTone = 'gold' | 'parchment' | 'cinnabar'

function heroToneOf(tone: string): HeroTone {
  if (tone === 'gold' || tone === 'jade') return 'gold'
  if (tone === 'cinnabar') return 'cinnabar'
  return 'parchment'
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { baziInput, ready, setPublishInfo } = useAppState()
  const chart = useBaZiChart()

  const fortune = useMemo(() => {
    if (!chart) return null
    return computeDailyFortune(chart, toYmd(new Date()))
  }, [chart])

  // 同一天首次进入：完整 1.8s 揭示仪式；同日再次进入：压缩 50%
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

  if (!ready) {
    return <p className="py-20 text-center text-qingmo">载入中…</p>
  }

  if (!baziInput || !fortune) {
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
  // grade.label 形如「吉 · 顺势可发」，拆成主词 + 副词分两层渲染
  const [verdictMain, verdictSub] = grade.label.split(/\s*·\s*/)

  // 快测：从首页风向行点视频类型 → 用今日 + 默认平台 → 直接出结果
  function quickTest(videoTypeId: string) {
    setPublishInfo({
      videoTypeId,
      title: '',
      platform: PLATFORMS[0],
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

      {/* 今日创作天时 Hero:真 3D 浑天仪 + 中央报文字;整片可点击 → 重排八字 */}
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
          {/* Hero 容器：底层 bg + AuroraBg 天光 + SkyDome28Xiu 星宿环 + TianwenHero 透明模式 */}
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

      {/* 下个吉时 */}
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
        </Card>
      </motion.div>

      {/* 今日内容风向 —— 点行直跳 result 快测 */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: d(1.3) }}
      >
        <Card title="今日内容风向" subtitle="点击直接测算">
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
    </div>
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

