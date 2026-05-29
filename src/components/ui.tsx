import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { spring, easeOut } from '@/motion/transitions'
import type { WuXing } from '@/domain/wuxing'
import { WU_XING_COLOR } from '@/domain/wuxing'
import type { QiChang } from '@/domain/huangli'

/** 功能页缺少八字数据时的统一占位 */
export function NeedBaZi() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-qingmo">该功能需要先录入生辰八字</p>
      <Link
        to="/bazi"
        className="cursor-pointer rounded-xl border border-shiqing/40 px-6 py-2.5 text-shiqing transition hover:bg-shiqing/10 active:scale-[0.98]"
      >
        去录入
      </Link>
    </div>
  )
}

type CardAccent = 'shiqing' | 'jin' | 'zhusha' | 'shilv'

const ACCENT_BAR: Record<CardAccent, string> = {
  shiqing: 'bg-shiqing',
  jin: 'bg-jin',
  zhusha: 'bg-zhusha',
  shilv: 'bg-shilv',
}

const ACCENT_TITLE: Record<CardAccent, string> = {
  shiqing: 'text-mibai',
  jin: 'text-jin-bright',
  zhusha: 'text-zhusha-bright',
  shilv: 'text-shilv',
}

export function Card({
  title,
  subtitle,
  children,
  className = '',
  style,
  interactive = false,
  layout = false,
  accent = 'shiqing',
}: {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  style?: CSSProperties
  interactive?: boolean
  layout?: boolean
  accent?: CardAccent
}) {
  const inner = (
    <>
      {title && (
        <header className="mb-3 flex items-baseline gap-2">
          <span className={`h-4 w-1 rounded-full ${ACCENT_BAR[accent]}`} />
          <h2 className={`text-base font-semibold tracking-wide ${ACCENT_TITLE[accent]}`}>{title}</h2>
          {subtitle && <span className="text-xs text-qingmo">{subtitle}</span>}
        </header>
      )}
      {children}
    </>
  )

  const cls = `yu-card rounded-2xl border border-shiqing/15 bg-ru-soft p-5 ${className}`

  if (interactive || layout) {
    return (
      <motion.section
        style={style}
        className={cls}
        layout={layout || undefined}
        whileHover={interactive ? { y: -2, boxShadow: 'var(--shadow-zhu)' } : undefined}
        whileTap={interactive ? { scale: 0.985 } : undefined}
        transition={spring}
      >
        {inner}
      </motion.section>
    )
  }

  return (
    <section style={style} className={cls}>
      {inner}
    </section>
  )
}

export function ElementBadge({ element, size = 'md' }: { element: WuXing; size?: 'sm' | 'md' }) {
  const color = WU_XING_COLOR[element]
  const dim = size === 'sm' ? 'h-5 w-5 text-xs' : 'h-7 w-7 text-sm'
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-semibold ${dim}`}
      style={{ borderColor: color, color }}
    >
      {element}
    </span>
  )
}

type PillTone = 'jin' | 'shilv' | 'zhusha' | 'shiqing' | 'soft' | 'gold' | 'jade' | 'cinnabar'

const PILL_TONES: Record<PillTone, string> = {
  jin: 'border-jin/40 text-jin-bright bg-jin/10',
  gold: 'border-jin/40 text-jin-bright bg-jin/10',
  shilv: 'border-shilv/50 text-shilv bg-shilv/10',
  jade: 'border-shilv/50 text-shilv bg-shilv/10',
  zhusha: 'border-zhusha/50 text-zhusha-bright bg-zhusha/10',
  cinnabar: 'border-zhusha/50 text-zhusha-bright bg-zhusha/10',
  shiqing: 'border-shiqing/50 text-shiqing bg-shiqing/10',
  soft: 'border-qingmo/30 text-qingmo bg-white/5',
}

export function Pill({ children, tone = 'jin' }: { children: ReactNode; tone?: PillTone }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${PILL_TONES[tone]}`}>
      {children}
    </span>
  )
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full cursor-pointer rounded-xl bg-gradient-to-b from-jin-bright to-jin py-3.5 text-base font-semibold text-ru shadow-lg shadow-jin/20 transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
    >
      {children}
    </button>
  )
}

export function ScoreBar({
  value,
  label,
  delay = 0,
  animate = true,
}: {
  value: number
  label?: string
  delay?: number
  animate?: boolean
}) {
  // 语义：高分 jade/shilv（吉）、中分 jin（金/平）、低分 zhusha（弱）
  const hue =
    value >= 65 ? 'var(--color-shilv)' : value >= 45 ? 'var(--color-jin)' : 'var(--color-zhusha)'
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-xs text-qingmo">
          <span>{label}</span>
          <span className="num" style={{ color: hue }}>
            {value}
          </span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: hue }}
          initial={animate ? { width: 0 } : false}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, delay, ease: easeOut }}
        />
      </div>
    </div>
  )
}

// 传播气场标签：旺→shilv、平→soft、弱→zhusha
const QICHANG_TONE: Record<QiChang['level'], PillTone> = {
  旺: 'shilv',
  平: 'soft',
  弱: 'zhusha',
}

/** 黄历「传播气场」标签 */
export function QiChangPill({ qiChang }: { qiChang: QiChang }) {
  return <Pill tone={QICHANG_TONE[qiChang.level]}>{qiChang.label}</Pill>
}

/** 平台流量高峰标记：朱砂色样式标签 */
export function PeakLabel() {
  return (
    <span
      aria-label="平台流量高峰"
      title="平台流量高峰"
      className="rounded border border-zhusha-bright/60 bg-zhusha-bright/12 px-1 text-[10px] font-semibold leading-[1.6] text-zhusha-bright"
    >
      峰
    </span>
  )
}
