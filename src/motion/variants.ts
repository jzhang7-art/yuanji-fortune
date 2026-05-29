import type { Variants } from 'framer-motion'
import { easeOut, spring, PAGE_DURATION, PAGE_EXIT_DURATION } from './transitions'

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: PAGE_DURATION, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: PAGE_EXIT_DURATION, ease: easeOut },
  },
}

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 0.08, staggerChildren: 0.06 } },
}

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOut },
  },
}

export const cardRise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: spring },
}

export const modalScale: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.18 } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4 } },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: easeOut } },
}
