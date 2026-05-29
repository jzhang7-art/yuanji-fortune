import type { CSSProperties, ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import { staggerChild } from './variants'

/**
 * 父容器：以 variants 驱动子元素交错入场。
 * - whileInView=true 时改为滚入触发（用于长页中段 reveal）。
 */
export function StaggerList({
  children,
  className,
  style,
  delayChildren = 0.08,
  staggerChildren = 0.06,
  whileInView = false,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  delayChildren?: number
  staggerChildren?: number
  whileInView?: boolean
}) {
  const variants: Variants = {
    hidden: {},
    show: { transition: { delayChildren, staggerChildren } },
  }

  if (whileInView) {
    return (
      <motion.div
        className={className}
        style={style}
        variants={variants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={className}
      style={style}
      variants={variants}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  )
}

/** StaggerList 的子项，自带 y:12 → 0 + opacity 渐显 */
export function StaggerItem({
  children,
  className,
  style,
  custom,
  variants,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  custom?: number
  variants?: Variants
}) {
  return (
    <motion.div
      className={className}
      style={style}
      custom={custom}
      variants={variants ?? staggerChild}
    >
      {children}
    </motion.div>
  )
}

