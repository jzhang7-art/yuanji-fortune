import { motion, useReducedMotion } from 'framer-motion'

/**
 * 十二时辰刻度环 — SVG textPath 圆周文字
 * 字符沿圆周均匀分布（react-bits CircularText 用 div+translate 公式会沿对角偏移，与仪表盘重叠）。
 * 慢速顺时针旋转作背景机括。
 */
export function ZodiacRing({
  size = 280,
  radius = 128,
  spinDuration = 90,
  text = '子 · 丑 · 寅 · 卯 · 辰 · 巳 · 午 · 未 · 申 · 酉 · 戌 · 亥 · ',
}: {
  size?: number
  radius?: number
  spinDuration?: number
  text?: string
}) {
  const reduced = useReducedMotion()
  const cx = size / 2
  const cy = size / 2
  // 顺时针圆弧路径（两段半圆）
  const ringPath = `M ${cx - radius} ${cy} a ${radius} ${radius} 0 1 1 ${radius * 2} 0 a ${radius} ${radius} 0 1 1 ${-radius * 2} 0`

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
      <defs>
        <path id="zodiac-ring-path" d={ringPath} />
      </defs>
      <text
        fill="var(--color-jin)"
        fontSize={13}
        letterSpacing="0.18em"
        style={{ fontFamily: '"Songti SC", "STSong", serif' }}
        opacity={0.55}
      >
        <textPath xlinkHref="#zodiac-ring-path" startOffset="0%">
          {text.repeat(2)}
        </textPath>
      </text>
    </motion.svg>
  )
}
