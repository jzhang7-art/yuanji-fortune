import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { track } from '@/analytics/track'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '@/state/AppState'
import { SHI_CHEN } from '@/data/ganzhi'
import { BAZI_YEAR_MIN, BAZI_YEAR_MAX } from '@/data/constants'
import { easeOut } from '@/motion/transitions'
import Magnet from '@/lib/react-bits/Magnet'
import ClickSpark from '@/lib/react-bits/ClickSpark'
import { tickFeedback } from '@/util/feedback'

/**
 * 莲启 · 入局 —— 首启引导（无八字时全屏呈现）
 * 完整多层青铜莲花（4 层叠瓣作层次）+ 中心渐隐暗场；莲心置一排「密码锁式拨号轮」：
 * 年/月/日/时辰/性别 横排，竖直拨动滚动、朱砂索引窗读当前值、松手吸附。
 * 莲花纯 SVG + framer-motion；拨号轮 HTML 自管指针拖拽。reduced-motion 直接全开静止。
 */

const YEAR_MIN = BAZI_YEAR_MIN
const YEAR_MAX = BAZI_YEAR_MAX

// 宽圆莲瓣：瓣根 (0,-rBase) 收窄、中段最宽、瓣尖 (0,-rTip) 圆收
function petal(rBase: number, rTip: number, w: number): string {
  const mid = rBase + (rTip - rBase) * 0.5
  const low = rBase + (rTip - rBase) * 0.22
  return `M0,${-rBase} C ${-w},${-low} ${-w},${-mid} ${-w * 0.7},${-(rTip - 14)} Q 0,${-rTip} ${w * 0.7},${-(rTip - 14)} C ${w},${-mid} ${w},${-low} 0,${-rBase} Z`
}

// 4 层叠瓣：外大内小、由暗及亮、错位 15°
const TIERS = [
  { rBase: 30, rTip: 196, w: 42, fill: 'url(#pt1)', stroke: 'rgba(120,150,130,0.35)', off: 0, delay: 0.2 },
  { rBase: 28, rTip: 166, w: 37, fill: 'url(#pt2)', stroke: 'rgba(150,178,158,0.4)', off: 15, delay: 0.34 },
  { rBase: 26, rTip: 134, w: 32, fill: 'url(#pt3)', stroke: 'rgba(178,205,186,0.45)', off: 0, delay: 0.48 },
  { rBase: 24, rTip: 104, w: 27, fill: 'url(#pt4)', stroke: 'rgba(200,222,206,0.5)', off: 15, delay: 0.62 },
]
const PETALS = Array.from({ length: 12 }, (_, i) => i * 30)

export function LotusOnboarding({ mode = 'onboarding' }: { mode?: 'onboarding' | 'edit' }) {
  const { baziInput, setBaziInput } = useAppState()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const isEdit = mode === 'edit'

  // edit 模式从已存八字 prefill,否则用默认初值 2000-01-01 午时 女
  const prefill = isEdit && baziInput ? baziInput : null
  const [yIdx, setY] = useState(prefill ? prefill.year - YEAR_MIN : 2000 - YEAR_MIN)
  const [mIdx, setM] = useState(prefill ? prefill.month - 1 : 0)
  const [dIdx, setD] = useState(prefill ? prefill.day - 1 : 0)
  const [sIdx, setS] = useState(prefill ? prefill.shiChenIndex : 6)
  const [gIdx, setG] = useState(prefill ? (prefill.gender === '男' ? 0 : 1) : 1)
  const [committing, setCommitting] = useState(false)

  useEffect(() => {
    if (isEdit) track('edit_bazi')
  }, [isEdit])

  const year = YEAR_MIN + yIdx
  const month = mIdx + 1
  const day = dIdx + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const valid = day <= daysInMonth

  const years = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => `${YEAR_MIN + i}`)
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}`)
  const days = Array.from({ length: 31 }, (_, i) => `${i + 1}`)
  const shis = SHI_CHEN.map((s) => s.zhi)

  function handleEnter() {
    if (!valid || committing) return
    track('bazi_submit', { gender: gIdx === 0 ? '男' : '女', mode })
    setCommitting(true)
    const commit = () => {
      setBaziInput({ year, month, day, shiChenIndex: sIdx, gender: gIdx === 0 ? '男' : '女' })
      if (isEdit) navigate('/')
    }
    if (reduced) commit()
    else window.setTimeout(commit, 760)
  }

  const bloom = (delay: number) => (reduced ? { duration: 0 } : { duration: 1.0, ease: easeOut, delay })

  // edit 模式由 Layout 提供 header/safe-area/底部 nav,容器只占据中央内容区
  const containerCls = isEdit
    ? 'relative flex flex-col items-center overflow-hidden px-2'
    : 'relative flex min-h-dvh flex-col items-center overflow-hidden bg-ru px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-[calc(env(safe-area-inset-top)+2rem)]'

  return (
    <div className={containerCls}>
      {isEdit && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="absolute right-2 top-0 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-shiqing/20 bg-ru-soft text-lg text-qingmo transition hover:border-shiqing/40 hover:text-mibai"
        >
          ×
        </button>
      )}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: reduced ? 0 : 0.2 }}
      >
        {!isEdit && (
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-jin/40 text-sm text-jin-bright">玄</span>
            <span className="text-base font-semibold tracking-[0.18em] text-mibai">玄机 · 发布择时</span>
          </div>
        )}
        <p className={`text-sm tracking-[0.3em] text-qingmo ${isEdit ? '' : 'mt-3'}`}>
          {isEdit ? '重 排 此 生 · 改 易 生 辰' : '莲 启 · 入 此 一 局'}
        </p>
      </motion.div>

      {/* —— 莲花 + 中央拨号轮 —— */}
      <div className="relative mt-1" style={{ width: 380, height: 380, maxWidth: '96vw' }}>
        <svg viewBox="-200 -200 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="pt1" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#16201b" /><stop offset="60%" stopColor="#314a3e" /><stop offset="100%" stopColor="#4d6a5a" />
            </linearGradient>
            <linearGradient id="pt2" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#1b2620" /><stop offset="60%" stopColor="#3c5a4b" /><stop offset="100%" stopColor="#5e7e6c" />
            </linearGradient>
            <linearGradient id="pt3" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#203029" /><stop offset="60%" stopColor="#4a6c59" /><stop offset="100%" stopColor="#74957f" />
            </linearGradient>
            <linearGradient id="pt4" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#27382f" /><stop offset="55%" stopColor="#587e69" /><stop offset="100%" stopColor="#90b09a" />
            </linearGradient>
            <radialGradient id="centerFade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-ru)" stopOpacity="0.97" />
              <stop offset="42%" stopColor="var(--color-ru)" stopOpacity="0.9" />
              <stop offset="72%" stopColor="var(--color-ru)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-jin-glow)" /><stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          <circle cx="0" cy="0" r="150" fill="url(#coreGlow)" opacity={committing ? 0.8 : 0.32} />

          {/* 浑仪极淡斜环（缓转，作背景机括） */}
          <motion.g className="text-shiqing" animate={reduced ? undefined : { rotate: 360 }} transition={reduced ? undefined : { duration: 320, repeat: Infinity, ease: 'linear' }} opacity={0.1}>
            <ellipse cx="0" cy="0" rx="192" ry="74" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <ellipse cx="0" cy="0" rx="74" ry="192" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </motion.g>

          {/* 4 层叠瓣（每层为单位绽放，对称组锚点=中心） */}
          {TIERS.map((t, ti) => (
            <motion.g
              key={ti}
              initial={{ scale: reduced ? 1 : 0.12, rotate: reduced ? 0 : -18, opacity: reduced ? 1 : 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={bloom(t.delay)}
            >
              {PETALS.map((ang) => (
                <g key={ang} transform={`rotate(${ang + t.off})`}>
                  <path d={petal(t.rBase, t.rTip, t.w)} fill={t.fill} stroke={t.stroke} strokeWidth="0.8" />
                </g>
              ))}
            </motion.g>
          ))}

          {/* 中心渐隐暗场（让拨号轮清晰） */}
          <circle cx="0" cy="0" r="150" fill="url(#centerFade)" />
        </svg>

        {/* —— 拨号轮（HTML 覆盖在莲心） —— */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.7, delay: 1.0 }}
        >
          <div className="relative flex items-stretch gap-1.5">
            {/* 朱砂索引窗（200px 视窗中央 1 行：80–120px） */}
            <div className="pointer-events-none absolute inset-x-[-6px] top-[80px] z-10 h-[40px] border-y border-zhusha-bright/55" />
            <Wheel values={years} index={yIdx} onChange={setY} width={62} mono disabled={committing} />
            <Wheel values={months} index={mIdx} onChange={setM} width={34} mono disabled={committing} />
            <Wheel values={days} index={dIdx} onChange={setD} width={34} mono invalid={!valid} disabled={committing} />
            <Wheel values={shis} index={sIdx} onChange={setS} width={34} disabled={committing} />
            <Wheel values={['男', '女']} index={gIdx} onChange={setG} width={38} disabled={committing} />
          </div>
        </motion.div>
      </div>

      {/* 入局 */}
      <motion.div
        className="-mt-2 flex w-full max-w-sm flex-col items-center gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.6, delay: 1.4 }}
      >
        <p className="text-xs tracking-[0.18em] text-qingmo">
          {SHI_CHEN[sIdx].name}{' '}
          <span className="tabular-nums text-qingmo-mute">{SHI_CHEN[sIdx].range}</span>
        </p>
        {!valid && <p className="text-xs tracking-[0.1em] text-zhusha-bright">该月无此日 · 请重拨日轮</p>}
        <Magnet
          padding={40}
          magnetStrength={4}
          disabled={!!reduced || committing || !valid}
          wrapperClassName="w-full"
        >
          <ClickSpark sparkColor="#e6c878" sparkCount={10} sparkRadius={28} duration={500}>
            <motion.button
              type="button"
              onClick={handleEnter}
              disabled={!valid || committing}
              whileTap={{ scale: 0.98 }}
              className="w-full cursor-pointer rounded-xl bg-gradient-to-b from-jin-bright to-jin py-3.5 text-base font-semibold tracking-[0.3em] text-ru shadow-lg shadow-jin/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {committing ? (isEdit ? '重 排 中 …' : '入 局 中 …') : isEdit ? '重 排' : '入 局'}
            </motion.button>
          </ClickSpark>
        </Magnet>
      </motion.div>
    </div>
  )
}

const ROW_H = 40
const WINDOW_H = 200
const baseOffset = (index: number) => WINDOW_H / 2 - ROW_H / 2 - index * ROW_H

/** 单个青铜密码锁拨号轮：竖直拖动滚动、松手吸附到索引窗 */
function Wheel({
  values,
  index,
  onChange,
  width,
  mono,
  invalid,
  disabled,
}: {
  values: string[]
  index: number
  onChange: (i: number) => void
  width: number
  mono?: boolean
  invalid?: boolean
  disabled?: boolean
}) {
  const [dragOffset, setDragOffset] = useState<number | null>(null)
  const drag = useRef<{ startY: number; startOff: number } | null>(null)
  const hoverIdxRef = useRef(index)

  const offset = dragOffset ?? baseOffset(index)

  function offsetToIdx(off: number): number {
    return Math.max(
      0,
      Math.min(values.length - 1, Math.round((WINDOW_H / 2 - ROW_H / 2 - off) / ROW_H)),
    )
  }

  function onDown(e: RPointerEvent) {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startY: e.clientY, startOff: baseOffset(index) }
    hoverIdxRef.current = index
    setDragOffset(baseOffset(index))
  }
  function onMove(e: RPointerEvent) {
    if (!drag.current) return
    const next = drag.current.startOff + (e.clientY - drag.current.startY)
    setDragOffset(next)
    // 每跨一格触发齿轮 tick
    const hoverIdx = offsetToIdx(next)
    if (hoverIdx !== hoverIdxRef.current) {
      hoverIdxRef.current = hoverIdx
      tickFeedback()
    }
  }
  function onUp() {
    if (!drag.current) return
    const off = dragOffset ?? baseOffset(index)
    const idx = offsetToIdx(off)
    drag.current = null
    setDragOffset(null)
    if (idx !== index) onChange(idx)
  }

  return (
    <div
      className="relative touch-none select-none overflow-hidden"
      style={{
        width,
        height: WINDOW_H,
        cursor: disabled ? 'default' : 'grab',
        maskImage: 'linear-gradient(to bottom, transparent 0%, #000 25%, #000 75%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 25%, #000 75%, transparent 100%)',
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div
        style={{
          transform: `translateY(${offset}px)`,
          transition: dragOffset === null ? 'transform 0.26s cubic-bezier(0.16,1,0.3,1)' : 'none',
        }}
      >
        {values.map((v, i) => {
          const distance = Math.abs(i - index)
          // 距中心距离 → 字号 / 透明度 / 颜色衰减（5 行可见：0 选中、±1 邻近、±2 远端）
          const fontSize = distance === 0 ? 28 : distance === 1 ? 22 : 18
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.75 : 0.4
          const color =
            distance === 0
              ? invalid
                ? 'var(--color-zhusha-bright)'
                : 'var(--color-jin)'
              : 'var(--color-qingmo)'
          const fontWeight = distance === 0 ? 600 : 400
          return (
            <div
              key={v}
              className={`${mono ? 'num ' : ''}flex items-center justify-center`}
              style={{
                height: ROW_H,
                fontSize,
                fontWeight,
                opacity,
                letterSpacing: mono ? '0.02em' : '0.08em',
                color,
                transition: 'font-size 0.2s ease-out, opacity 0.2s ease-out, color 0.2s ease-out',
              }}
            >
              {v}
            </div>
          )
        })}
      </div>
    </div>
  )
}
