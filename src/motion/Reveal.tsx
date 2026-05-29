import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { easeOut } from './transitions'

/** 滚入视口时淡入 + 上移；用于长页里的卡片群分段揭示 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
  amount = 0.15,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  amount?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.5, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  )
}
