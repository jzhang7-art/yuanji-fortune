import { Fragment, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { springSnappy } from '@/motion/transitions'
import { getSession, setSession, removeSession } from '@/platform/session'

const FLOW_PATHS = new Set(['/bazi', '/publish', '/result'])
const FLOW_KEY = 'flow-started-from-bazi'

/**
 * 三步流程进度指示器：当前步用 layoutId 滑动高亮。
 * 智能模式：当用户从 /publish 起步（跳过 /bazi）时，仅显示 2 步「内容/结果」。
 */
export function Stepper() {
  const { pathname } = useLocation()
  const [fromBazi, setFromBazi] = useState(false)

  useEffect(() => {
    if (pathname === '/bazi') {
      setSession(FLOW_KEY, '1')
      setFromBazi(true)
    } else if (FLOW_PATHS.has(pathname)) {
      setFromBazi(getSession(FLOW_KEY) === '1')
    } else {
      removeSession(FLOW_KEY)
    }
  }, [pathname])

  if (!FLOW_PATHS.has(pathname)) return null

  const steps = fromBazi ? ['速览', '内容', '结果'] : ['内容', '结果']
  const routeStep: Record<string, number> = fromBazi
    ? { '/bazi': 1, '/publish': 2, '/result': 3 }
    : { '/publish': 1, '/result': 2 }
  const current = routeStep[pathname]
  if (!current) return null

  return (
    <nav
      aria-label={`发布择时流程，共 ${steps.length} 步，当前第 ${current} 步：${steps[current - 1]}`}
      className="flex items-center justify-center gap-2 px-4 py-2.5"
    >
      {steps.map((label, i) => {
        const step = i + 1
        const state = step < current ? 'done' : step === current ? 'active' : 'todo'
        return (
          <Fragment key={label}>
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={`relative flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold ${
                  state === 'active'
                    ? 'border-zhusha-bright text-ru'
                    : state === 'done'
                      ? 'border-shilv/50 text-shilv'
                      : 'border-qingmo/30 text-qingmo/50'
                }`}
              >
                {state === 'active' && (
                  <motion.span
                    layoutId="stepperActiveFill"
                    className="absolute inset-0 -m-px rounded-full bg-zhusha-bright"
                    transition={springSnappy}
                  />
                )}
                <span className="relative">{step}</span>
              </span>
              <span
                className={`text-xs transition-colors ${
                  state === 'active'
                    ? 'font-semibold text-zhusha-bright'
                    : state === 'done'
                      ? 'text-qingmo'
                      : 'text-qingmo/50'
                }`}
              >
                {label}
              </span>
            </div>
            {step < steps.length && (
              <span
                aria-hidden
                className={`h-px w-6 transition-colors ${step < current ? 'bg-shilv/40' : 'bg-qingmo/20'}`}
              />
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
