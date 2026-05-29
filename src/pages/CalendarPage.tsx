import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { track } from '@/analytics/track'
import { useAppState } from '@/state/AppState'
import { useBaZiChart } from '@/hooks/useBaZiChart'
import { computeCalendar, computeDailyFortune, scoreGrade } from '@/domain/scoring'
import type { DayScore } from '@/domain/scoring'
import { Card, NeedBaZi, QiChangPill } from '@/components/ui'
import { FortuneScene } from '@/components/decor/FortuneScene'
import { Reveal } from '@/motion/Reveal'
import { spring } from '@/motion/transitions'
import { formatDate, fromYmd, toYmd } from '@/util'

const WEEK_HEAD = ['日', '一', '二', '三', '四', '五', '六']
const CELLS = 42

function tone(score: number): { bg: string; text: string } {
  if (score >= 65) return { bg: 'bg-shilv/25', text: 'text-shilv' }
  if (score >= 50) return { bg: 'bg-jin/25', text: 'text-jin-bright' }
  if (score >= 38) return { bg: 'bg-white/5', text: 'text-qingmo' }
  return { bg: 'bg-zhusha/20', text: 'text-zhusha-bright' }
}

export function CalendarPage() {
  const { baziInput, ready } = useAppState()
  const today = toYmd(new Date())

  const [month, setMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selected, setSelected] = useState<string | null>(null)

  const chart = useBaZiChart()

  useEffect(() => {
    track('calendar_view')
  }, [])

  const gridStart = useMemo(() => {
    const s = new Date(month)
    s.setDate(1 - s.getDay())
    return s
  }, [month])

  const [grid, setGrid] = useState<DayScore[] | null>(null)
  useEffect(() => {
    if (!chart) return
    setGrid(null)
    const t = setTimeout(() => {
      setGrid(computeCalendar(chart, toYmd(gridStart), CELLS))
    }, 0)
    return () => clearTimeout(t)
  }, [chart, gridStart])

  const detail = useMemo(() => {
    if (!chart || !selected) return null
    return computeDailyFortune(chart, selected)
  }, [chart, selected])

  if (!ready) return <p className="py-20 text-center text-qingmo">载入中…</p>
  if (!baziInput) return <NeedBaZi />

  const monthLabel = `${month.getFullYear()}年${month.getMonth() + 1}月`

  function shiftMonth(delta: number) {
    setSelected(null)
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  }

  return (
    <FortuneScene tone="jieqi">
      <div className="flex flex-col gap-4">
        <motion.p
          className="text-center text-sm text-qingmo"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          本月发布吉日热力图
        </motion.p>

        <Reveal>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <motion.button
                type="button"
                onClick={() => shiftMonth(-1)}
                whileTap={{ scale: 0.94 }}
                className="cursor-pointer rounded-lg border border-shiqing/25 px-3 py-1.5 text-sm text-shiqing transition-colors hover:bg-shiqing/10"
              >
                上月
              </motion.button>
              <motion.span
                key={monthLabel}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-base font-semibold text-mibai"
              >
                {monthLabel}
              </motion.span>
              <motion.button
                type="button"
                onClick={() => shiftMonth(1)}
                whileTap={{ scale: 0.94 }}
                className="cursor-pointer rounded-lg border border-shiqing/25 px-3 py-1.5 text-sm text-shiqing transition-colors hover:bg-shiqing/10"
              >
                下月
              </motion.button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1">
              {WEEK_HEAD.map((w) => (
                <div key={w} className="py-1 text-center text-xs text-qingmo">
                  {w}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {!grid ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-7 gap-1"
                >
                  {Array.from({ length: CELLS }).map((_, i) => (
                    <div key={i} className="h-13 animate-pulse rounded-lg bg-white/5" />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key={`grid-${monthLabel}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-7 gap-1"
                >
                  {grid.map((d, i) => {
                    const dt = fromYmd(d.date)
                    const inMonth = dt.getMonth() === month.getMonth()
                    const isToday = d.date === today
                    const isPast = d.date < today
                    const t = tone(d.score)
                    const row = Math.floor(i / 7)
                    return (
                      <motion.button
                        key={d.date}
                        type="button"
                        onClick={() => setSelected(d.date)}
                        whileTap={{ scale: 0.93 }}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.32,
                          delay: 0.04 + row * 0.04 + (i % 7) * 0.012,
                        }}
                        className={`relative flex h-13 cursor-pointer flex-col items-center justify-center rounded-lg transition-colors ${t.bg} ${
                          inMonth ? '' : 'opacity-30'
                        } ${isPast ? 'opacity-45' : ''} ${
                          isToday ? 'ring-1 ring-jin-bright' : ''
                        }`}
                      >
                        {selected === d.date && (
                          <motion.span
                            layoutId="calSelected"
                            className="absolute inset-0 rounded-lg ring-2 ring-zhusha-bright"
                            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                          />
                        )}
                        <span className="text-xs text-mibai">{dt.getDate()}</span>
                        <span className={`text-[11px] font-semibold tabular-nums ${t.text}`}>
                          {d.score}
                        </span>
                      </motion.button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-3 flex justify-center gap-3 text-[11px] text-qingmo">
              <Legend cls="bg-shilv/25" label="吉 ≥65" />
              <Legend cls="bg-jin/25" label="平 50+" />
              <Legend cls="bg-zhusha/20" label="弱 <38" />
            </div>
          </Card>
        </Reveal>

        <AnimatePresence>
          {detail && (
            <motion.div
              key={detail.date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring}
            >
              <Card title={`${formatDate(detail.date)} · ${detail.dayGanZhi}日`}>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold tabular-nums text-jin-bright">
                    {detail.dayScore}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-mibai">
                        {scoreGrade(detail.dayScore).label}
                      </span>
                      <QiChangPill qiChang={detail.huangli.qiChang} />
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-qingmo">
                      {detail.huangli.qiChang.reading}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FortuneScene>
  )
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-3 w-3 rounded ${cls}`} />
      {label}
    </span>
  )
}
