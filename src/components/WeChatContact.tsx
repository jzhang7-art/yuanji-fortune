import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Copy, Check, X } from 'lucide-react'
import { track } from '@/analytics/track'
import { Card } from './ui'

const WECHAT_ID = 'mhftzr369'
const QR_SRC = `${import.meta.env.BASE_URL}wechat-qr.jpg`

/**
 * 微信联系卡片。两层用法：
 * - <WeChatCard /> 直接挂在页面流里（/about 用）
 * - <WeChatModal open onClose /> 全屏遮罩弹层（/me 入口用）
 *
 * 埋点：mount 时 contact_wechat_view；点复制时 contact_wechat_copy。
 */
export function WeChatCard({ source }: { source: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    track('contact_wechat_view', { source })
  }, [source])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(WECHAT_ID)
      track('contact_wechat_copy', { source })
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 不挡用户，复制失败也无所谓 — 微信号显示在屏幕上他能手抄
    }
  }

  return (
    <Card title="加我微信" subtitle="拿邀请码 · 反馈问题 · 命理咨询" accent="jin">
      <div className="flex flex-col items-center gap-4">
        <div className="overflow-hidden rounded-2xl border border-jin/30 bg-ru-deep p-2">
          <img
            src={QR_SRC}
            alt="作者微信二维码"
            width={220}
            height={220}
            loading="lazy"
            className="block h-[220px] w-[220px] rounded-xl object-cover"
          />
        </div>

        <p className="text-center text-xs leading-relaxed text-qingmo">
          长按二维码 → 保存图片 → 微信「扫一扫」相册扫码
          <br />
          或直接复制微信号搜索添加：
        </p>

        <button
          type="button"
          onClick={handleCopy}
          className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-shiqing/25 bg-ru-deep px-4 py-3 transition hover:border-shiqing/45 active:scale-[0.99]"
        >
          <span className="font-mono text-base tracking-wider text-jin-bright">
            {WECHAT_ID}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-qingmo">
            {copied ? (
              <>
                <Check size={14} className="text-shilv" />
                <span className="text-shilv">已复制</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>复制</span>
              </>
            )}
          </span>
        </button>
      </div>
    </Card>
  )
}

export function WeChatModal({
  open,
  onClose,
  source,
}: {
  open: boolean
  onClose: () => void
  source: string
}) {
  const reduced = useReducedMotion()

  // ESC 关闭
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="加微信"
        >
          <motion.div
            initial={reduced ? false : { scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="absolute right-2 top-2 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-shiqing/25 bg-ru-deep text-qingmo transition hover:text-mibai"
            >
              <X size={16} strokeWidth={1.6} />
            </button>
            <WeChatCard source={source} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
