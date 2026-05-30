import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { VIDEO_TYPES } from '@/data/videoTypes'
import { PLATFORMS } from '@/data/scoringConfig'
import type { PreferredTracks } from '@/storage'
import { ElementBadge } from '@/components/ui'

const MAX_TRACKS = 3

export function TrackPickerSheet({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  initial: PreferredTracks | null
  onClose: () => void
  onSave: (next: PreferredTracks) => void
}) {
  const reduced = useReducedMotion()
  const [trackIds, setTrackIds] = useState<string[]>([])
  const [platform, setPlatform] = useState<string>(PLATFORMS[0])

  useEffect(() => {
    if (!open) return
    setTrackIds(initial?.trackIds ?? [])
    setPlatform(initial?.platform ?? PLATFORMS[0])
  }, [open, initial])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  function toggle(id: string) {
    setTrackIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_TRACKS) return prev
      return [...prev, id]
    })
  }

  function handleSave() {
    if (trackIds.length === 0) return
    onSave({ trackIds, platform })
    onClose()
  }

  const reachedCap = trackIds.length >= MAX_TRACKS

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-[100] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="关闭"
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="选你常做的赛道"
            className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl border-t border-jin/20 bg-ru-soft pb-[env(safe-area-inset-bottom)] shadow-2xl shadow-black/40"
            initial={reduced ? { opacity: 0 } : { y: '100%' }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <header className="flex items-baseline justify-between px-5 pb-3 pt-5">
              <div>
                <h2 className="text-base font-semibold text-mibai">选你常做的赛道</h2>
                <p className="mt-0.5 text-xs text-qingmo">
                  最多 {MAX_TRACKS} 个 · 已选 {trackIds.length}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="取消"
                className="-mr-2 cursor-pointer rounded-lg px-2 py-1 text-xs text-qingmo transition hover:text-mibai"
              >
                取消
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5">
              <div className="grid grid-cols-3 gap-2">
                {VIDEO_TYPES.map((vt) => {
                  const active = trackIds.includes(vt.id)
                  const disabled = !active && reachedCap
                  return (
                    <motion.button
                      key={vt.id}
                      type="button"
                      onClick={() => toggle(vt.id)}
                      disabled={disabled}
                      aria-pressed={active}
                      whileTap={disabled ? undefined : { scale: 0.95 }}
                      className={`relative flex w-full flex-col items-center gap-1 overflow-hidden rounded-xl border py-2.5 transition-colors ${
                        active
                          ? 'border-zhusha bg-zhusha/15'
                          : 'border-shiqing/15 bg-ru-deep hover:border-shiqing/40 active:bg-shiqing/8'
                      } ${disabled ? 'cursor-not-allowed opacity-35' : 'cursor-pointer'}`}
                    >
                      <span className="text-2xl" aria-hidden>
                        {vt.icon}
                      </span>
                      <span
                        className={`text-xs ${active ? 'text-zhusha-bright' : 'text-qingmo'}`}
                      >
                        {vt.name}
                      </span>
                      <span className="flex gap-0.5">
                        {vt.elements.map((e) => (
                          <ElementBadge key={e} element={e} size="sm" />
                        ))}
                      </span>
                    </motion.button>
                  )
                })}
              </div>

              <label className="mt-5 block">
                <span className="mb-1.5 block text-sm text-qingmo">你的主用平台</span>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-shiqing/20 bg-ru-deep px-3 py-2.5 text-mibai transition-colors focus:border-shiqing/60"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-1 text-xs text-qingmo-mute">
                Dashboard 上的分数会按你的主平台算,与详测页对齐
              </p>
            </div>

            <footer className="px-5 pb-4 pt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={trackIds.length === 0}
                className="w-full cursor-pointer rounded-xl bg-gradient-to-b from-jin-bright to-jin py-3 text-base font-semibold text-ru shadow-lg shadow-jin/20 transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
              >
                保存
              </button>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
