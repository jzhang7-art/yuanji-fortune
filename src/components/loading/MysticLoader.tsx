import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const STAGES = ['排八字时柱…', '起奇门时局…', '演算十二时辰…'] as const

export function MysticLoader({
  variant = 'full',
  minDurationMs,
}: {
  variant?: 'full' | 'compact'
  minDurationMs?: number
}) {
  const reduced = useReducedMotion()
  const isCompact = variant === 'compact'
  const minDuration = minDurationMs ?? (isCompact ? 300 : 600)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = window.setTimeout(() => setTick(1), minDuration)
    return () => window.clearTimeout(id)
  }, [minDuration])
  void tick

  if (isCompact) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <motion.span
          className="text-sm tracking-[0.32em] text-jin-bright"
          animate={reduced ? undefined : { opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          ░ 排 八 字 中 ░
        </motion.span>
        <FlowBar reduced={reduced} width="w-40" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5 py-12">
      <motion.span
        className="text-base tracking-[0.36em] text-jin-bright"
        animate={reduced ? undefined : { opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        ░ 推 演 中 ░
      </motion.span>

      <FlowBar reduced={reduced} width="w-56" />

      <ul className="flex flex-col gap-1.5 text-center text-sm text-qingmo">
        {STAGES.map((label, i) => (
          <motion.li
            key={label}
            initial={reduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: reduced ? 0 : 0.2 + i * 0.22 }}
          >
            <span className="mr-2 text-qingmo-mute" aria-hidden>
              ▢
            </span>
            {label}
          </motion.li>
        ))}
      </ul>

      <div className="mt-2 flex w-full max-w-xs flex-col gap-2" aria-hidden>
        {[0.78, 0.92, 0.66, 0.88].map((w, i) => (
          <motion.div
            key={i}
            className="h-3 rounded-full bg-ru-deep"
            style={{ width: `${Math.round(w * 100)}%` }}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.5, delay: reduced ? 0 : 0.6 + i * 0.08 }}
          />
        ))}
      </div>
    </div>
  )
}

function FlowBar({ reduced, width }: { reduced: boolean | null; width: string }) {
  if (reduced) {
    return (
      <div className={`relative h-[3px] ${width} overflow-hidden rounded-full bg-ru-deep`}>
        <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-jin/40 via-jin-bright to-jin/40" />
      </div>
    )
  }
  return (
    <div className={`relative h-[3px] ${width} overflow-hidden rounded-full bg-ru-deep`}>
      <motion.div
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-jin-bright to-transparent"
        animate={{ x: ['-100%', '300%'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
