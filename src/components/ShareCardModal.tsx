// 分享卡片预览/保存弹层：离屏渲染 ShareCard → html-to-image 栅格化为 PNG
import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { AnimatePresence, motion } from 'framer-motion'
import { ShareCard, type ShareCardProps } from '@/components/ShareCard'
import { spring } from '@/motion/transitions'

export function ShareCardModal({
  onClose,
  ...cardProps
}: ShareCardProps & { onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  // Esc 关闭 + 焦点管理
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prevFocus?.focus?.()
    }
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    async function render() {
      const node = cardRef.current
      if (!node) return
      try {
        // document.fonts 在 Safari < 15 / 旧设备 / 小程序环境可能缺失
        if (typeof document !== 'undefined' && document.fonts?.ready) {
          await document.fonts.ready
        }
        await new Promise((r) => requestAnimationFrame(() => r(null)))
        const url = await toPng(node, { pixelRatio: 3, cacheBust: true, skipFonts: true })
        if (!cancelled) setDataUrl(url)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }
    void render()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
        role="dialog"
        aria-modal="true"
        aria-label="分享卡片"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
      >
        {/* 离屏卡片源（保留真实尺寸供栅格化，不能用 display:none） */}
        <div className="fixed -left-[9999px] top-0" aria-hidden>
          <div ref={cardRef}>
            <ShareCard {...cardProps} />
          </div>
        </div>

        <motion.div
          ref={panelRef}
          tabIndex={-1}
          className="flex w-full max-w-xs flex-col items-center gap-4 outline-none"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={spring}
        >
          {!dataUrl && !failed && (
            <p className="py-12 text-parchment-soft">正在生成分享卡片…</p>
          )}
          {failed && <p className="py-12 text-cinnabar-bright">生成失败，请重试</p>}
          {dataUrl && (
            <>
              <motion.img
                src={dataUrl}
                alt="分享卡片"
                className="w-full rounded-2xl shadow-2xl shadow-black/50"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              />
              <p className="text-xs text-parchment-soft">长按图片保存，或点击下方按钮下载</p>
              <motion.a
                href={dataUrl}
                download="玄机-发布择时.png"
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-xl bg-gradient-to-b from-gold-bright to-gold py-3 text-center text-base font-semibold text-ink"
              >
                保存图片
              </motion.a>
            </>
          )}
          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl border border-gold/30 py-2.5 text-parchment-soft"
          >
            关闭
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
