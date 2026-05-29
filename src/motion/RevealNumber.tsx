import { useEffect, useRef, type CSSProperties } from 'react'
import { useReducedMotion, useSpring } from 'framer-motion'

/**
 * 用 useSpring 让数字从 0 弹跳到目标值，直接操作 DOM textContent 避免每帧 React 重渲染。
 * - format: 自定义格式化（默认四舍五入到整数）
 * - reduced-motion 命中时直接 jump 到终值
 */
export function RevealNumber({
  value,
  format,
  className,
  style,
  start = 0,
  stiffness = 80,
  damping = 18,
  mass = 0.6,
}: {
  value: number
  format?: (n: number) => string
  className?: string
  style?: CSSProperties
  start?: number
  stiffness?: number
  damping?: number
  mass?: number
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const spring = useSpring(start, { stiffness, damping, mass })

  useEffect(() => {
    if (reduced) {
      spring.jump(value)
    } else {
      spring.set(value)
    }
  }, [value, reduced, spring])

  useEffect(() => {
    const fmt = format ?? ((n: number) => Math.round(n).toString())
    if (ref.current) ref.current.textContent = fmt(reduced ? value : start)
    return spring.on('change', (n) => {
      if (ref.current) ref.current.textContent = fmt(n)
    })
  }, [spring, format, reduced, value, start])

  const initial = (format ?? ((n: number) => Math.round(n).toString()))(reduced ? value : start)

  return (
    <span ref={ref} className={`num ${className ?? ''}`} style={style}>
      {initial}
    </span>
  )
}
