import { lazy, Suspense } from 'react'
import { TianwenChartSvgFallback } from './TianwenChartSvg'

const TianwenHeroReal = lazy(() =>
  import('./TianwenHero').then((m) => ({ default: m.TianwenHero }))
)

type Props = React.ComponentProps<typeof TianwenHeroReal>

function Fallback() {
  return (
    <div className="relative flex items-center justify-center" style={{ minHeight: 380 }}>
      <TianwenChartSvgFallback size={348} />
    </div>
  )
}

export function TianwenHeroLazy(props: Props) {
  return (
    <Suspense fallback={<Fallback />}>
      <TianwenHeroReal {...props} />
    </Suspense>
  )
}
