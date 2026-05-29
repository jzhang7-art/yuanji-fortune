import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

type RowTone = 'default' | 'danger'

interface RowLinkProps {
  icon: ReactNode
  label: string
  trailing?: ReactNode
  to?: string
  onClick?: () => void
  tone?: RowTone
  showChevron?: boolean
}

const BASE =
  'flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-shiqing/15 bg-ru-soft/70 px-4 py-3.5 text-left backdrop-blur-sm transition-colors hover:border-shiqing/30 active:bg-ru-deep/60'

export function RowLink({
  icon,
  label,
  trailing,
  to,
  onClick,
  tone = 'default',
  showChevron = true,
}: RowLinkProps) {
  const labelCls =
    tone === 'danger' ? 'text-zhusha-bright' : 'text-mibai'

  const content = (
    <>
      {/* 图标区：无底色，用颜色区分语义 */}
      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-qingmo">
        {icon}
      </span>
      <span className={`flex-1 text-[15px] font-normal leading-snug ${labelCls}`}>
        {label}
      </span>
      {trailing && (
        <span className="mr-1 text-xs tabular-nums text-qingmo">{trailing}</span>
      )}
      {showChevron && (
        <ChevronRight size={16} strokeWidth={1.5} className="shrink-0 text-qingmo-mute" />
      )}
    </>
  )

  if (to) {
    return (
      <motion.div whileTap={{ scale: 0.985 }}>
        <Link to={to} className={BASE}>
          {content}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className={BASE}
    >
      {content}
    </motion.button>
  )
}

/** 分组标题 — 小字间距弱灰，统一视觉气口 */
export function RowGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      {title && (
        <h3 className="px-1 text-[11px] tracking-[0.22em] text-qingmo-mute">{title}</h3>
      )}
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}
