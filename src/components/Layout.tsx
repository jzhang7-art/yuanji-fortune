import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Stepper } from '@/components/Stepper'
import { BottomNav } from '@/components/BottomNav'
import { RemoteMountains } from '@/components/decor/RemoteMountains'
import { scrollToTop } from '@/platform/scroll'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    scrollToTop()
  }, [pathname])
  return null
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-ru">
      <RemoteMountains />
      <ScrollToTop />
      <header className="sticky top-0 z-10 border-b border-shiqing/12 bg-ru/85 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex items-center px-4 py-1">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-jin/40 text-jin-bright">
              玄
            </span>
            <span className="text-lg font-semibold tracking-wide text-mibai" style={{ letterSpacing: '0.05em' }}>
              玄机 · 发布择时
            </span>
          </Link>
        </div>
        <Stepper />
      </header>
      <main className="relative z-[1] flex-1 px-4 pb-[calc(3.5rem+env(safe-area-inset-bottom)+1.5rem)] pt-4">
        {children}
        <Disclaimer />
      </main>
      <BottomNav />
    </div>
  )
}

export function Disclaimer() {
  return (
    <footer className="mt-8 border-t border-shiqing/10 px-4 pt-5 text-center text-xs leading-relaxed text-qingmo-mute">
      本应用基于八字、黄历、奇门遁甲等传统术数文化，结果由算法推演得出，
      <br />
      仅供娱乐参考，不构成任何决策建议。内容能否传播取决于选题、质量与平台机制。
    </footer>
  )
}
