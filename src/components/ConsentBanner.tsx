import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getConsent, setConsent } from '@/analytics/consent'

export function ConsentBanner() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(getConsent() === 'unset')
  }, [])
  if (!visible) return null
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-30 mx-auto max-w-md rounded-2xl border border-shiqing/20 bg-ru-deep/95 p-4 text-xs leading-relaxed text-mibai shadow-2xl backdrop-blur"
      role="dialog"
      aria-label="隐私同意"
    >
        <p className="mb-3">
          我们使用匿名使用统计来改进产品。生辰八字等内容
          <strong className="text-jin-bright">仅存于本机</strong>，
          不会上传。详见
          <Link to="/privacy" className="ml-1 underline">隐私政策</Link>。
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => { setConsent('denied'); setVisible(false) }}
            className="flex-1 rounded-lg border border-shiqing/30 px-3 py-2 text-qingmo"
          >仅使用必要功能</button>
          <button
            onClick={() => { setConsent('granted'); setVisible(false) }}
            className="flex-1 rounded-lg bg-zhusha-bright px-3 py-2 font-medium text-ru"
          >同意并继续</button>
        </div>
    </motion.div>
  )
}
