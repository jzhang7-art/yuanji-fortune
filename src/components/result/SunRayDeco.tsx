import { motion, useReducedMotion } from 'framer-motion'

/**
 * 太阳光芒纹 — 12 道金色细线从中心向外发散（对应十二时辰）
 * 用作 ProbabilityGauge 最外圈装饰，灵感取自 Dribbble #19792998 Wheel of Fortune 古金太阳轮。
 * stroke 0.5px，rays radial 从 r=130 → r=148（外突 18px），慢速顺时针缓转作背景机括。
 */
export function SunRayDeco({
  size = 296,
  rays = 12,
  innerR = 130,
  outerR = 148,
  spinDuration = 240,
}: {
  size?: number
  rays?: number
  innerR?: number
  outerR?: number
  spinDuration?: number
}) {
  const reduced = useReducedMotion()
  const cx = size / 2
  const cy = size / 2

  return (
    <motion.svg
      aria-hidden
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="pointer-events-none absolute inset-0 m-auto"
      style={{ width: size, height: size }}
      animate={reduced ? undefined : { rotate: 360 }}
      transition={reduced ? undefined : { duration: spinDuration, repeat: Infinity, ease: 'linear' }}
    >
      {Array.from({ length: rays }).map((_, i) => {
        const angle = (i * 360) / rays
        const rad = (angle * Math.PI) / 180
        const x1 = cx + innerR * Math.cos(rad)
        const y1 = cy + innerR * Math.sin(rad)
        const x2 = cx + outerR * Math.cos(rad)
        const y2 = cy + outerR * Math.sin(rad)
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-jin)"
            strokeWidth="0.6"
            strokeLinecap="round"
            opacity="0.45"
          />
        )
      })}
      {/* 中间小线段：12 道短线（在 12 道长线之间） */}
      {Array.from({ length: rays }).map((_, i) => {
        const angle = (i * 360) / rays + 360 / (rays * 2)
        const rad = (angle * Math.PI) / 180
        const x1 = cx + (innerR + 4) * Math.cos(rad)
        const y1 = cy + (innerR + 4) * Math.sin(rad)
        const x2 = cx + (outerR - 4) * Math.cos(rad)
        const y2 = cy + (outerR - 4) * Math.sin(rad)
        return (
          <line
            key={`m${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-jin)"
            strokeWidth="0.4"
            strokeLinecap="round"
            opacity="0.25"
          />
        )
      })}
    </motion.svg>
  )
}
