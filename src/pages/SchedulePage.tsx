import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { track } from '@/analytics/track'
import { useAppState } from '@/state/AppState'
import { useBaZiChart } from '@/hooks/useBaZiChart'
import { computeSchedule, scoreGrade } from '@/domain/scoring'
import { VIDEO_TYPES } from '@/data/videoTypes'
import { PLATFORMS } from '@/data/scoringConfig'
import { Card, ElementBadge, NeedBaZi, ScoreBar } from '@/components/ui'
import { LockedSection } from '@/components/LockedSection'
import { useInvite } from '@/features/invite'
import { FortuneScene } from '@/components/decor/FortuneScene'
import { StaggerList, StaggerItem } from '@/motion/Stagger'
import { Reveal } from '@/motion/Reveal'
import { spring } from '@/motion/transitions'
import { formatDate, toYmd } from '@/util'

const WINDOW = 14
const MIN_COUNT = 2
const MAX_COUNT = 7

const FREE_PICK_COUNT = 2

export function SchedulePage() {
  const { baziInput, ready } = useAppState()
  const chart = useBaZiChart()
  const { unlocked } = useInvite()
  const [videoTypeId, setVideoTypeId] = useState('')
  const [platform, setPlatform] = useState<string>(PLATFORMS[0])
  const [count, setCount] = useState(3)

  useEffect(() => {
    track('schedule_view')
  }, [])

  const result = useMemo(() => {
    if (!chart || !videoTypeId) return null
    const video = VIDEO_TYPES.find((v) => v.id === videoTypeId)
    if (!video) return null
    return {
      video,
      ...computeSchedule(chart, video, platform, toYmd(new Date()), WINDOW, count),
    }
  }, [chart, videoTypeId, platform, count])

  if (!ready) return <p className="py-20 text-center text-qingmo">载入中…</p>
  if (!baziInput) return <NeedBaZi />

  return (
    <FortuneScene tone="luopan">
      <StaggerList className="flex flex-col gap-4">
        <StaggerItem>
          <p className="text-center text-sm text-qingmo">
            多期同类视频，排出未来 {WINDOW} 天最佳发布档期
          </p>
        </StaggerItem>

        <StaggerItem>
          <Card title="你做的视频类型" subtitle="选最贴近的一类">
            <div className="grid grid-cols-3 gap-2">
              {VIDEO_TYPES.map((vt) => {
                const active = vt.id === videoTypeId
                return (
                  <motion.button
                    key={vt.id}
                    type="button"
                    onClick={() => setVideoTypeId(vt.id)}
                    aria-pressed={active}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex cursor-pointer flex-col items-center gap-1 overflow-hidden rounded-xl border py-2.5 transition-colors ${
                      active
                        ? 'border-zhusha bg-zhusha/15'
                        : 'border-shiqing/15 bg-ru-deep hover:border-shiqing/40'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="scheduleTypeActive"
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
                  </motion.button>
                )
              })}
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card title="排期设置">
            <div className="flex flex-col gap-4">
              <label className="block">
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
              <div className="flex items-center justify-between">
                <span className="text-sm text-qingmo">这批视频条数</span>
                <div className="flex items-center gap-3">
                  <StepBtn
                    label="减少"
                    disabled={count <= MIN_COUNT}
                    onClick={() => setCount((c) => Math.max(MIN_COUNT, c - 1))}
                  >
                    −
                  </StepBtn>
                  <span className="w-6 text-center text-lg font-semibold tabular-nums text-jin-bright">
                    {count}
                  </span>
                  <StepBtn
                    label="增加"
                    disabled={count >= MAX_COUNT}
                    onClick={() => setCount((c) => Math.min(MAX_COUNT, c + 1))}
                  >
                    ＋
                  </StepBtn>
                </div>
              </div>
            </div>
          </Card>
        </StaggerItem>

        {!result ? (
          <StaggerItem>
            <Card>
              <p className="py-6 text-center text-sm text-qingmo">
                先选一个视频类型即可生成排期
              </p>
            </Card>
          </StaggerItem>
        ) : (
          <>
            <Reveal>
              <Card title="发布排期表" subtitle={`${result.video.name} · ${count} 条`}>
                <div className="flex flex-col gap-2">
                  {(unlocked ? result.picked : result.picked.slice(0, FREE_PICK_COUNT)).map(
                    (slot, i) => (
                      <motion.div
                        key={slot.date}
                        initial={{ opacity: 0, scale: 0.92, x: -8 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ ...spring, delay: 0.05 + i * 0.07 }}
                        className="flex items-center gap-3 rounded-xl bg-ru-deep p-3"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-jin-bright text-sm font-bold text-ru">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="text-base font-semibold text-mibai">
                            {formatDate(slot.date)} {slot.weekday}
                          </div>
                          <div className="text-xs text-qingmo">
                            {slot.bestHour.name} {slot.bestHour.range} · {slot.dayGanZhi}日
                          </div>
                        </div>
                        <span className="text-xl font-bold tabular-nums text-jin-bright">
                          {slot.dayScore}
                        </span>
                      </motion.div>
                    ),
                  )}
                </div>
                {unlocked ? (
                  <p className="mt-3 text-xs leading-relaxed text-qingmo-mute">
                    第 1 条最早发布。每天仅排 1 条，避免同类内容自相分流；如需赶进度可在相邻吉日补发。
                  </p>
                ) : (
                  result.picked.length > FREE_PICK_COUNT && (
                    <p className="mt-3 text-xs leading-relaxed text-zhusha-bright/85">
                      余 {result.picked.length - FREE_PICK_COUNT} 期已锁，兑换邀请码后展开完整排期。
                    </p>
                  )
                )}
              </Card>
            </Reveal>

            <LockedSection
              feature="schedule"
              title={`解锁 ${count} 期完整排期 + 14 天发布指数`}
              subtitle="对比未来 14 天每一天的发布指数曲线，挑出全部档期与最佳首发时刻。"
            >
              <Reveal>
                <Card title={`未来 ${WINDOW} 天发布指数`} subtitle="深色为已选档期">
                  <div className="flex flex-col gap-2">
                    {result.all.map((slot, i) => {
                      const isPicked = result.picked.some((p) => p.date === slot.date)
                      return (
                        <div key={slot.date} className="flex items-center gap-2">
                          <span
                            className={`w-20 shrink-0 text-xs ${
                              isPicked ? 'font-semibold text-jin-bright' : 'text-qingmo'
                            }`}
                          >
                            {formatDate(slot.date)} {slot.weekday}
                          </span>
                          <div className="flex-1">
                            <ScoreBar value={slot.dayScore} delay={0.05 + i * 0.025} />
                          </div>
                          <span className="w-8 shrink-0 text-right text-xs tabular-nums text-mibai">
                            {slot.dayScore}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </Reveal>

              <Reveal>
                <div className="flex items-start gap-2 rounded-xl bg-ru-deep p-3">
                  <span className="flex gap-0.5 pt-0.5">
                    {result.video.elements.map((e) => (
                      <ElementBadge key={e} element={e} size="sm" />
                    ))}
                  </span>
                  <p className="text-sm leading-relaxed text-mibai">
                    首发档 {formatDate(result.picked[0].date)} {result.picked[0].weekday}，发布指数{' '}
                    {result.picked[0].dayScore}（{scoreGrade(result.picked[0].dayScore).label}）。
                  </p>
                </div>
              </Reveal>
            </LockedSection>
          </>
        )}
      </StaggerList>
    </FortuneScene>
  )
}

function StepBtn({
  children,
  label,
  disabled,
  onClick,
}: {
  children: string
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-shiqing/30 text-lg text-shiqing transition-colors hover:bg-shiqing/10 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </motion.button>
  )
}
