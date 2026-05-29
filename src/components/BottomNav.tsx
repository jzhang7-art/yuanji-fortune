import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { springSnappy } from '@/motion/transitions'

type IconName = 'home' | 'compass' | 'calendar' | 'user'

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (name) {
    case 'home':
      return (
        <svg {...common} aria-hidden>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      )
    case 'compass':
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M16 8l-2.6 6.6L8 16l2.6-6.6z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common} aria-hidden>
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 2.5v4M16 2.5v4" />
        </svg>
      )
    case 'user':
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="8" r="3.6" />
          <path d="M5 20c0-3.9 3.1-6.2 7-6.2s7 2.3 7 6.2" />
        </svg>
      )
  }
}

const TABS: { to: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { to: '/', label: '首页', icon: 'home', match: (p) => p === '/' || p === '/schedule' || p === '/talent' },
  { to: '/bazi', label: '测算', icon: 'compass', match: (p) => p === '/bazi' || p === '/publish' || p === '/result' },
  { to: '/calendar', label: '日历', icon: 'calendar', match: (p) => p === '/calendar' },
  { to: '/me', label: '我的', icon: 'user', match: (p) => p === '/me' },
]

/** 底部标签栏：首页 / 测算 / 日历 / 我的；当前 tab 顶部朱砂胶囊 layoutId 滑动 */
export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-shiqing/12 bg-ru/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="flex">
        {TABS.map((tab) => {
          const active = tab.match(pathname)
          return (
            <div key={tab.to} className="relative flex-1">
              {active && (
                <motion.span
                  layoutId="navIndicator"
                  className="pointer-events-none absolute left-1/2 top-0 h-[2px] w-6 -translate-x-1/2 rounded-full bg-zhusha-bright"
                  transition={springSnappy}
                  aria-hidden
                />
              )}
              <motion.div whileTap={{ scale: 0.92 }} className="h-full">
                <Link
                  to={tab.to}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                    active ? 'text-zhusha-bright' : 'text-qingmo'
                  }`}
                >
                  <Icon name={tab.icon} />
                  {tab.label}
                </Link>
              </motion.div>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
