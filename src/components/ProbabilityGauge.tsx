import { useEffect } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { scoreGrade } from '@/domain/scoring'
import { RevealNumber } from '@/motion/RevealNumber'
import { easeOut } from '@/motion/transitions'

/**
 * 爆火概率仪表盘 — 宋代圭表造型
 * 双圈结构：内圈 28 宿微缩星盘（静态）+ 外圈 240° 动态进度弧
 * 中心：等宽 Mono 大数字 + 日影指针从圆心射到进度终点
 */
export function ProbabilityGauge({
  value,
  label = '今日爆火概率',
}: {
  value: number
  label?: string
}) {
  const reduced = useReducedMotion()
  const size = 240
  const stroke = 14
  const r = (size - stroke) / 2 - 4
  const cx = size / 2
  const cy = size / 2
  const sweep = 240
  const startAngle = 90 + (360 - sweep) / 2

  const polar = (deg: number) => {
    const rad = (deg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  const start = polar(startAngle)
  const end = polar(startAngle + sweep)
  const large = sweep > 180 ? 1 : 0
  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`

  const grade = scoreGrade(value)
  // V2 二态：>=50 用金，<50 用朱砂；不再过渡色
  const color = value >= 50 ? 'var(--color-jin)' : 'var(--color-zhusha)'
  const colorBright =
    value >= 50 ? 'var(--color-jin-bright)' : 'var(--color-zhusha-bright)'

  const progress = useMotionValue(reduced ? value / 100 : 0)
  useEffect(() => {
    if (reduced) {
      progress.set(value / 100)
      return
    }
    const c = animate(progress, value / 100, { duration: 0.9, ease: easeOut })
    return () => c.stop()
  }, [value, reduced, progress])

  // 日影指针端点：从圆心到当前进度位置
  const tipX = useTransform(progress, (p) => {
    const ang = ((startAngle + p * sweep) * Math.PI) / 180
    return cx + r * Math.cos(ang)
  })
  const tipY = useTransform(progress, (p) => {
    const ang = ((startAngle + p * sweep) * Math.PI) / 180
    return cy + r * Math.sin(ang)
  })
  // 指针根部稍微留出星图区域
  const innerX = useTransform(progress, (p) => {
    const ang = ((startAngle + p * sweep) * Math.PI) / 180
    return cx + 38 * Math.cos(ang)
  })
  const innerY = useTransform(progress, (p) => {
    const ang = ((startAngle + p * sweep) * Math.PI) / 180
    return cy + 38 * Math.sin(ang)
  })

  // 数字落定时短暂金光
  const glow = useMotionValue(reduced ? 0.1 : 0)
  useEffect(() => {
    if (reduced) {
      glow.set(0.1)
      return
    }
    const c = animate(glow, [0, 0.25, 0.1], {
      duration: 1.0,
      times: [0, 0.55, 1],
      delay: 0.4,
    })
    return () => c.stop()
  }, [value, reduced, glow])

  // 内圈 28 宿微缩星盘点位
  const innerStars = Array.from({ length: 28 }).map((_, i) => {
    const ang = ((i * (360 / 28) - 90) * Math.PI) / 180
    return { x: cx + 70 * Math.cos(ang), y: cy + 70 * Math.sin(ang) }
  })

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      {/* 中心柔光（数字落定时短亮） */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          opacity: glow,
          background: `radial-gradient(circle at center, var(--color-jin-glow) 0%, transparent 60%)`,
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label} ${value}%，评级${grade.label}`}
        className="relative"
      >
        {/* —— 内圈 28 宿微缩星盘（静态） —— */}
        <g opacity="0.18" className="text-shiqing">
          <circle cx={cx} cy={cy} r={70} fill="none" stroke="currentColor" strokeWidth="0.4" />
          <circle cx={cx} cy={cy} r={86} fill="none" stroke="currentColor" strokeWidth="0.3" />
          {innerStars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={1} fill="currentColor" />
          ))}
        </g>

        {/* —— 极星标（中心朱砂十字） —— */}
        <g opacity="0.55">
          <line
            x1={cx - 5}
            y1={cy}
            x2={cx + 5}
            y2={cy}
            stroke="var(--color-zhusha-bright)"
            strokeWidth="0.6"
          />
          <line
            x1={cx}
            y1={cy - 5}
            x2={cx}
            y2={cy + 5}
            stroke="var(--color-zhusha-bright)"
            strokeWidth="0.6"
          />
        </g>

        {/* —— 进度轨道（极淡背景） —— */}
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* —— 进度弧（动画揭示） —— */}
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
        {/* —— 日影指针（从内圈延伸到进度终点） —— */}
        <motion.line
          x1={innerX}
          y1={innerY}
          x2={tipX}
          y2={tipY}
          stroke={colorBright}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* —— 指针端点圆点 —— */}
        <motion.circle cx={tipX} cy={tipY} r={3.5} fill={colorBright} />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] text-qingmo uppercase">{label}</span>
        <span
          className="leading-none num"
          style={{
            color: colorBright,
            fontSize: 64,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            marginTop: 4,
          }}
        >
          <RevealNumber value={value} />
          <span style={{ fontSize: 22, opacity: 0.7, marginLeft: 2 }}>%</span>
        </span>
        <span
          className="mt-1 text-sm font-medium"
          style={{ color: color, letterSpacing: '0.1em' }}
        >
          {grade.label}
        </span>
      </div>
    </div>
  )
}
