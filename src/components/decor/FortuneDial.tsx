import { useEffect } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { easeOut } from '@/motion/transitions'

/**
 * 半圆 dial / meter — "下个吉时" 评分具象化（参考 Dribbble #25723407 Astrology Home）
 * 270° 弧（-135° → +135°），值 0-100 映射到弧长。
 * 主色：金（值≥50）/ 朱砂（值<50）。
 * 中央 tabular-nums 大数字（动画从 0 弹跳到 value）。
 */
export function FortuneDial({
  value,
  size = 132,
  stroke = 8,
  label,
}: {
  value: number
  size?: number
  stroke?: number
  label?: string
}) {
  const reduced = useReducedMotion()
  const r = (size - stroke) / 2 - 2
  const cx = size / 2
  const cy = size / 2
  const sweep = 270
  const startAngle = 90 + (360 - sweep) / 2 // 从 135° 起，顺时针到 405° (=45°)
  const polar = (deg: number) => {
    const rad = (deg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  const start = polar(startAngle)
  const end = polar(startAngle + sweep)
  const large = sweep > 180 ? 1 : 0
  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`

  // 二态配色
  const color = value >= 50 ? 'var(--color-jin)' : 'var(--color-zhusha)'
  const colorBright = value >= 50 ? 'var(--color-jin-bright)' : 'var(--color-zhusha-bright)'

  // 进度动画
  const progress = useMotionValue(reduced ? value / 100 : 0)
  useEffect(() => {
    if (reduced) {
      progress.set(value / 100)
      return
    }
    const c = animate(progress, value / 100, { duration: 0.9, ease: easeOut })
    return () => c.stop()
  }, [value, reduced, progress])

  // 中央数字动画
  const numValue = useMotionValue(reduced ? value : 0)
  useEffect(() => {
    if (reduced) {
      numValue.set(value)
      return
    }
    const c = animate(numValue, value, { duration: 1.0, ease: easeOut })
    return () => c.stop()
  }, [value, reduced, numValue])
  const numText = useTransform(numValue, (n) => Math.round(n).toString())

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${label ?? ''} ${value}`}>
        {/* 背景弧（极淡） */}
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* 进度弧 */}
        <motion.path
          d={trackPath}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: reduced ? value / 100 : 0 }}
          animate={{ pathLength: value / 100 }}
          transition={{ duration: reduced ? 0 : 0.9, ease: easeOut }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="num tabular-nums"
          style={{
            color: colorBright,
            fontSize: size * 0.28,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {numText}
        </motion.span>
        {label && (
          <span className="mt-1 text-[10px] tracking-[0.2em] text-qingmo">{label}</span>
        )}
      </div>
    </div>
  )
}
