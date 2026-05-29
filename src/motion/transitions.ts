import type { Transition } from 'framer-motion'

export const spring: Transition = { type: 'spring', stiffness: 240, damping: 28 }
export const springSoft: Transition = { type: 'spring', stiffness: 180, damping: 24, mass: 0.7 }
export const springSnappy: Transition = { type: 'spring', stiffness: 380, damping: 32 }
export const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1]
export const PAGE_DURATION = 0.32
export const PAGE_EXIT_DURATION = 0.18
