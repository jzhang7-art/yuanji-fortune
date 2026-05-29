import { type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '@/state/AppState'
import { useBaZiChart } from '@/hooks/useBaZiChart'
import { SHI_CHEN } from '@/data/ganzhi'
import { Card, ElementBadge, Pill } from '@/components/ui'
import { WU_XING_COLOR } from '@/domain/wuxing'
import { FortuneScene } from '@/components/decor/FortuneScene'
import { StaggerList, StaggerItem } from '@/motion/Stagger'

const PRIMARY_ENTRY = { to: '/publish', title: '进入测算', desc: '细测一条视频运势' }
const ENTRIES: { to: string; title: string; desc: string; gradientStyle: CSSProperties; borderClass: string }[] = [
  { to: '/schedule', title: '排多期', desc: '同类多条排档期', gradientStyle: { background: 'linear-gradient(to bottom, #232c33, rgba(74,115,150,0.55))' }, borderClass: 'border-shiqing/50 hover:border-shiqing/80' },
  { to: '/calendar', title: '看本月', desc: '本月吉日热力图', gradientStyle: { background: 'linear-gradient(to bottom, #232c33, rgba(90,138,106,0.55))' }, borderClass: 'border-shilv/50 hover:border-shilv/80' },
  { to: '/talent',   title: '看赛道', desc: '命定内容赛道',   gradientStyle: { background: 'linear-gradient(to bottom, #232c33, rgba(178,58,46,0.45))' }, borderClass: 'border-zhusha/40 hover:border-zhusha/70' },
]

export function BaZiPage() {
  const { baziInput } = useAppState()
  const chart = useBaZiChart()

  if (!baziInput || !chart) {
    // 几乎不会走到此处(Shell 已守卫无八字 → LotusOnboarding)
    return (
      <FortuneScene tone="ganzhi">
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-qingmo">尚未录入生辰</p>
          <Link
            to="/lotus"
            className="rounded-xl bg-gradient-to-b from-jin-bright to-jin px-6 py-3 text-base font-semibold text-ru shadow-lg shadow-jin/20"
          >
            录入生辰八字
          </Link>
        </div>
      </FortuneScene>
    )
  }

  const shichen = SHI_CHEN[baziInput.shiChenIndex]

  return (
    <FortuneScene tone="ganzhi">
      <StaggerList className="flex flex-col gap-4">
        <StaggerItem>
          <div className="text-center">
            <p className="text-sm tracking-[0.28em] text-qingmo">命 盘 速 览 · 八 字 概 览</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <Card title="命盘速览" subtitle="实时推演" layout>
            {/* 命主生辰 */}
            <div className="mb-3 flex items-center justify-between rounded-lg bg-ru-deep px-3 py-2">
              <span className="text-[11px] tracking-[0.18em] text-qingmo">命 主</span>
              <span className="text-xs tracking-wider text-mibai">
                {baziInput.year}年{baziInput.month}月{baziInput.day}日 · {shichen.name}（{shichen.range}） · {baziInput.gender}
              </span>
            </div>

            {/* 四柱九宫 */}
            <div className="grid grid-cols-4 gap-2">
              {[chart.year, chart.month, chart.day, chart.time].map((p) => (
                <div key={p.label} className="rounded-xl bg-ru-deep py-2 text-center">
                  <div className="text-[11px] text-qingmo">{p.label}</div>
                  <div className="text-xl font-semibold" style={{ color: WU_XING_COLOR[p.ganWuXing] }}>{p.gan}</div>
                  <div className="text-xl font-semibold" style={{ color: WU_XING_COLOR[p.zhiWuXing] }}>{p.zhi}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tone="jin">
                日主 {chart.dayMaster}·{chart.dayMasterWuXing}
              </Pill>
              <Pill tone="soft">命局{chart.strength}</Pill>
              <span className="text-xs text-qingmo">喜用</span>
              {chart.favorable.map((e) => (
                <ElementBadge key={e} element={e} size="sm" />
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-qingmo">{chart.analysis}</p>
            <p className="mt-2 rounded-lg bg-ru-deep p-2.5 text-xs leading-relaxed text-qingmo">
              {chart.talentReading}
            </p>

            {/* 重排生辰小入口(辅助) */}
            <div className="mt-3 text-center">
              <Link
                to="/lotus"
                className="inline-block text-[11px] tracking-[0.24em] text-qingmo-mute underline-offset-4 transition hover:text-qingmo hover:underline"
              >
                重 排 生 辰
              </Link>
            </div>
          </Card>
        </StaggerItem>

        {/* 四入口 Hub */}
        <StaggerItem>
          <div className="flex flex-col gap-3">
            <Link
              to={PRIMARY_ENTRY.to}
              className="flex cursor-pointer items-center justify-between rounded-2xl border border-jin/30 bg-gradient-to-r from-ru-soft to-ru-deep p-4 shadow-lg shadow-black/30 transition hover:border-jin/60 active:scale-[0.99]"
            >
              <span className="text-base font-semibold text-jin-bright">{PRIMARY_ENTRY.title}</span>
              <span className="text-xs text-qingmo">{PRIMARY_ENTRY.desc} →</span>
            </Link>
            <div className="grid grid-cols-3 gap-3">
              {ENTRIES.map((e) => (
                <Link
                  key={e.to}
                  to={e.to}
                  style={e.gradientStyle}
                  className={`flex cursor-pointer flex-col gap-1 rounded-2xl border ${e.borderClass} p-3 shadow-lg shadow-black/30 transition active:scale-[0.98]`}
                >
                  <span className="text-sm font-semibold text-mibai">{e.title}</span>
                  <span className="text-[11px] leading-relaxed text-qingmo">{e.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </StaggerItem>
      </StaggerList>
    </FortuneScene>
  )
}
