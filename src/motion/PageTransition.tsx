import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { pageVariants } from './variants'

/** 路由切换淡入 + y:8 微位移过场。父级负责传入 location.pathname 作为 key。 */
export function PageTransition({ locationKey, children }: { locationKey: string; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={locationKey}
        variants={pageVariants}
        initial="hidden"
        animate="show"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
