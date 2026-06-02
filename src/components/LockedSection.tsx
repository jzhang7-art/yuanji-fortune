import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { useInvite } from '@/features/invite'
import { track } from '@/analytics/track'
import { Card } from './ui'

/**
 * 内容门控：解锁前显示邀请码兑换卡，解锁后渲染 children。
 *
 * - feature：用于埋点的特性 id（结果详解/全月日历/排期/赛道…）
 * - title/subtitle：兑换卡的诱饵文案（"还能看到什么"）
 * - children：解锁后才展示的实际内容
 */
export interface LockedSectionProps {
  feature: string
  title?: string
  subtitle?: string
  children: ReactNode
}

export function LockedSection({
  feature,
  title = '解锁完整内容',
  subtitle,
  children,
}: LockedSectionProps) {
  const { unlocked } = useInvite()
  const seen = useRef(false)

  useEffect(() => {
    if (!unlocked && !seen.current) {
      seen.current = true
      track('invite_prompt_shown', { feature })
    }
  }, [unlocked, feature])

  if (unlocked) return <>{children}</>

  return <RedeemCard feature={feature} title={title} subtitle={subtitle} />
}

/**
 * 邀请码兑换卡。可独立用在 Settings / 各 LockedSection 内部。
 */
export function RedeemCard({
  feature,
  title = '兑换邀请码',
  subtitle,
}: {
  feature: string
  title?: string
  subtitle?: string
}) {
  const { redeem } = useInvite()
  const reduced = useReducedMotion()
  const [code, setCode] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    track('invite_redeem_attempt', { feature })
    const success = redeem(code)
    if (success) {
      track('invite_redeem_success', { feature })
      setOk(true)
      setErr(null)
    } else {
      setErr('邀请码无效，请检查是否输错')
    }
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card accent="zhusha" className="relative overflow-hidden">
        <div className="flex items-center gap-2 text-zhusha-bright">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zhusha/15 text-zhusha-bright shadow-[0_0_10px_rgba(178,58,46,0.35)]">
            <Lock size={14} strokeWidth={1.8} />
          </span>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-zhusha/40 px-2.5 py-1 text-[11px] font-medium text-zhusha-bright/90">
            每周仅放 <span className="num">7</span> 枚 · 限量入局
          </span>
        </div>
        {subtitle && (
          <p className="mt-2 text-sm leading-relaxed text-qingmo">{subtitle}</p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-qingmo">
          天机不可尽泄，持令牌者方见全盘。
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-qingmo-mute">
          抖音搜「<span className="text-mibai">明和符</span>」→ 点赞 + 关注 + 评论，每周评论区随机抽 <span className="num text-mibai">7</span> 位赠码。
        </p>

        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setErr(null)
            }}
            placeholder="LOTUS-XXXX"
            aria-label="邀请码"
            disabled={ok}
            className="flex-1 rounded-xl border border-shiqing/25 bg-ru-deep px-3 py-2.5 text-sm tracking-wider text-mibai placeholder:text-qingmo-mute focus:border-zhusha/60 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={ok || !code.trim()}
            className="cursor-pointer rounded-xl bg-gradient-to-b from-zhusha-bright to-zhusha px-4 py-2.5 text-sm font-semibold text-mibai shadow-md shadow-zhusha/20 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {ok ? '已解锁' : '解锁'}
          </button>
        </form>

        {err && (
          <p className="mt-2 text-xs text-zhusha-bright" role="alert">
            {err}
          </p>
        )}
        {ok && (
          <p className="mt-2 text-xs text-shilv" role="status">
            ✓ 解锁成功，已为你打开全部功能
          </p>
        )}
      </Card>
    </motion.div>
  )
}
