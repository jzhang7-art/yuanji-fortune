import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { track } from '@/analytics/track'
import { useAppState } from '@/state/AppState'
import { useBaZiChart } from '@/hooks/useBaZiChart'
import type { BaZiChart } from '@/domain/bazi'
import { videoAffinityScore } from '@/domain/scoring'
import { VIDEO_TYPES } from '@/data/videoTypes'
import type { VideoType } from '@/data/videoTypes'
import { Card, ElementBadge, NeedBaZi, Pill, ScoreBar } from '@/components/ui'
import { LockedSection } from '@/components/LockedSection'
import { useInvite } from '@/features/invite'
import { StaggerList, StaggerItem } from '@/motion/Stagger'
import { Reveal } from '@/motion/Reveal'
import { RevealNumber } from '@/motion/RevealNumber'
import { slideInLeft } from '@/motion/variants'
import { spring } from '@/motion/transitions'

function affinityReason(video: VideoType, chart: BaZiChart): string {
  const hit = video.elements.filter((e) => chart.favorable.includes(e))
  if (hit.length > 0) return `${hit.join('、')}属你命局喜用，长期深耕更顺势。`
  const bad = video.elements.filter((e) => chart.unfavorable.includes(e))
  if (bad.length > 0) return `${bad.join('、')}与命局喜用相左，宜作副线尝试。`
  return '五行与命局关系平平，可凭兴趣选择。'
}

export function TalentPage() {
  const { baziInput, ready } = useAppState()
  const { unlocked } = useInvite()
  const chart = useBaZiChart()

  useEffect(() => {
    track('talent_view')
  }, [])

  const ranked = useMemo(() => {
    if (!chart) return null
    return VIDEO_TYPES.map((video) => ({
      video,
      score: videoAffinityScore(video, chart),
      reason: affinityReason(video, chart),
    })).sort((a, b) => b.score - a.score)
  }, [chart])

  if (!ready) return <p className="py-20 text-center text-qingmo">载入中…</p>
  if (!baziInput || !chart || !ranked) return <NeedBaZi />

  return (
    <StaggerList className="flex flex-col gap-4">
      <StaggerItem>
        <div className="text-center">
          <p className="text-sm text-qingmo">按你的八字喜用神，排出命定的内容赛道</p>
        </div>
      </StaggerItem>

      <StaggerItem>
        <Card title="命局喜用" subtitle={`日主 ${chart.dayMaster}·${chart.dayMasterWuXing}`}>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="soft">命局{chart.strength}</Pill>
            <span className="text-xs text-qingmo">喜用五行</span>
            {chart.favorable.map((e) => (
              <ElementBadge key={e} element={e} size="sm" />
            ))}
          </div>
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Card title="你的命定赛道" subtitle={unlocked ? '前三高契合' : '第三名先露脸'}>
          <StaggerList
            className="flex flex-col gap-3"
            delayChildren={0.15}
            staggerChildren={0.12}
          >
            {ranked.slice(0, 3).map((r, i) => {
              // 锁定第 1、2 名（index 0、1）的分数与解读，露名次与五行；第 3 名（index 2）完全免费
              const itemLocked = !unlocked && i < 2
              return (
                <StaggerItem
                  key={r.video.id}
                  variants={slideInLeft}
                  className="flex flex-col gap-1.5 rounded-xl bg-ru-deep p-3"
                >
                  <div className="flex items-center gap-2">
                    <motion.span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-jin-bright text-xs font-bold text-ru"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ ...spring, delay: 0.3 + i * 0.12 }}
                    >
                      {i + 1}
                    </motion.span>
                    <span
                      className={`text-xl ${itemLocked ? 'blur-lg select-none' : ''}`}
                      aria-hidden
                    >
                      {r.video.icon}
                    </span>
                    <span
                      className={`text-base font-semibold text-mibai ${
                        itemLocked ? 'blur-lg select-none' : ''
                      }`}
                    >
                      {r.video.name}
                    </span>
                    <span
                      className={`flex gap-0.5 ${itemLocked ? 'blur-lg select-none' : ''}`}
                    >
                      {r.video.elements.map((e) => (
                        <ElementBadge key={e} element={e} size="sm" />
                      ))}
                    </span>
                    <span
                      className={`ml-auto text-lg font-bold tabular-nums text-jin-bright ${
                        itemLocked ? 'blur-lg select-none' : ''
                      }`}
                    >
                      {itemLocked ? r.score : <RevealNumber value={r.score} />}
                    </span>
                  </div>
                  <ScoreBar value={r.score} delay={0.4 + i * 0.12} />
                  {itemLocked ? (
                    <p className="text-xs leading-relaxed text-zhusha-bright/80">
                      🔒 第 {i + 1} 名 · 解锁揭晓真身与分数
                    </p>
                  ) : (
                    <p className="text-xs leading-relaxed text-qingmo">{r.reason}</p>
                  )}
                </StaggerItem>
              )
            })}
          </StaggerList>
        </Card>
      </StaggerItem>

      <LockedSection
        feature="talent"
        title="解锁前两名 + 全部赛道排名"
        subtitle="第 1、2 名才是你命局最契合的方向；解锁后还能看到剩余 12 个类型的契合度。"
      >
        <Reveal>
          <Card title="全部类型契合度">
            <div className="flex flex-col gap-2.5">
              {ranked.slice(3).map((r, i) => (
                <motion.div
                  key={r.video.id}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                >
                  <span className="w-5 shrink-0 text-center text-xs tabular-nums text-qingmo">
                    {i + 4}
                  </span>
                  <span className="text-lg" aria-hidden>
                    {r.video.icon}
                  </span>
                  <span className="w-20 shrink-0 text-sm text-mibai">{r.video.name}</span>
                  <div className="flex-1">
                    <ScoreBar value={r.score} delay={i * 0.03} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-mibai">
                    {r.score}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        </Reveal>
      </LockedSection>

      <StaggerItem>
        <p className="px-2 text-center text-xs leading-relaxed text-zhusha-bright/90">
          命定赛道仅供娱乐参考。选你真正热爱、且愿长期投入的方向，才是流量的根本。
        </p>
      </StaggerItem>
    </StaggerList>
  )
}
