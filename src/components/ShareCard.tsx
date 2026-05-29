// 结果分享卡片：3:4 竖图（CSS 360×480，栅格化时 pixelRatio 3 → 1080×1440）
// 主卡背后叠 2 张影子卡作扇形 stack，主卡用 SpotlightCard 静态金色光斑（html-to-image 兼容）
import type { Decision, Forecast } from '@/domain/scoring'
import type { VideoType } from '@/data/videoTypes'
import type { PublishInfo } from '@/types'
import { ScoreBar } from '@/components/ui'
import { formatDate } from '@/util'
import { GRADE_COLOR, VERDICT_HEADLINE } from '@/data/resultDisplay'
import SpotlightCard from '@/lib/react-bits/SpotlightCard'

export interface ShareCardProps {
  forecast: Forecast
  video: VideoType
  decision: Decision
  publishInfo: PublishInfo
}

export function ShareCard({ forecast, video, decision, publishInfo }: ShareCardProps) {
  const { target } = forecast
  const { grade, verdict } = decision
  const bestHour = forecast.bestHours[0]
  const bestDay = forecast.bestDays[0]
  const multiDay = forecast.futureDays.length > 1
  const gradeColor = GRADE_COLOR[grade.tone] ?? GRADE_COLOR.parchment

  return (
    <div
      className="relative w-[380px] pt-5 pl-5 pb-2 pr-3"
      style={{
        // 不用 Noto Serif SC（font-serif-cn），因为 html-to-image 配合 skipFonts:true 会落回系统宋体，
        // 与 React 渲染时已加载的 NS SC 字宽不一致，导致 toPng 输出字符错位（layout shift）。
        // 强制用系统宋体栈让 raw render 和 toPng 字宽一致。
        fontFamily: '"Songti SC", "STSong", "SimSun", serif',
      }}
    >
      {/* 扇形影子卡 2（最远，露出左上角） */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-5 top-5 h-[480px] w-[360px] -translate-x-[14px] -translate-y-[10px] -rotate-2 rounded-2xl border border-gold/35 bg-ink-soft opacity-60"
      />
      {/* 扇形影子卡 1（中间） */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-5 top-5 h-[480px] w-[360px] -translate-x-[7px] -translate-y-[5px] rotate-[-0.7deg] rounded-2xl border border-gold/45 bg-ink-soft opacity-80"
      />
      {/* 主卡：SpotlightCard 静态金色光斑（fontFamily 由 wrapper inherit） */}
      <SpotlightCard
        className="flex h-[480px] w-[360px] flex-col rounded-2xl border border-gold/30 bg-ink p-6 text-parchment"
        spotlightColor="rgba(230, 200, 120, 0.42)"
        staticPosition={{ x: 84, y: 56 }}
        staticOpacity={0.75}
      >
      {/* 品牌行 */}
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md border border-gold/50 text-sm text-gold-bright">
          玄
        </span>
        <span className="text-sm font-semibold tracking-wide text-gold-bright">
          玄机 · 发布择时
        </span>
      </div>

      {/* 元信息 */}
      <p className="mt-0.5 text-xs text-parchment-soft">
        {video.name} · {publishInfo.platform} · {formatDate(publishInfo.targetDate)}发布
      </p>

      {/* 主视觉：爆火概率 */}
      <div className="mt-3 flex flex-col items-center">
        <span className="text-xs tracking-[0.35em] text-parchment-soft">爆火概率</span>
        <div className="flex items-end">
          <span
            className="text-[56px] font-semibold leading-none"
            style={{ color: gradeColor }}
          >
            {target.overall}
          </span>
          <span className="mb-1.5 ml-0.5 text-xl" style={{ color: gradeColor }}>
            %
          </span>
        </div>
        <span
          className="mt-1 rounded-full border px-3 py-0.5 text-sm font-semibold"
          style={{ borderColor: gradeColor, color: gradeColor }}
        >
          {grade.label}
        </span>
        <p className="mt-1.5 text-base font-semibold text-parchment">
          {VERDICT_HEADLINE[verdict]}
        </p>
      </div>

      {/* 四维运势条 */}
      <div className="mt-4 flex flex-col gap-2">
        <ScoreBar label="八字运势" value={target.baziDayScore} animate={false} />
        <ScoreBar label="黄历宜忌" value={target.huangli.score} animate={false} />
        <ScoreBar label="奇门时局" value={target.qimenAvg} animate={false} />
        <ScoreBar label="视频五行" value={target.videoScore} animate={false} />
      </div>

      {/* 最佳时辰 / 吉日 */}
      <div className="mt-3 flex flex-col gap-1.5">
        <CardRow label="最佳时辰" value={`${bestHour.name} ${bestHour.range}`} />
        {multiDay && (
          <CardRow
            label="最佳吉日"
            value={`${formatDate(bestDay.date)} ${bestDay.weekday}`}
          />
        )}
      </div>

      {/* 页脚 */}
      <div className="mt-auto border-t border-gold/15 pt-2.5 text-center">
        <p className="text-xs font-semibold tracking-wide text-gold-bright">
          玄机 · 发布择时 — 测你的发布吉时
        </p>
        <p className="mt-0.5 text-[10px] text-parchment-muted">
          玄学推演仅供娱乐参考
        </p>
      </div>
      </SpotlightCard>
    </div>
  )
}


function CardRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-ink-soft px-3 py-1.5">
      <span className="text-gold-bright">★</span>
      <span className="text-xs text-parchment-soft">{label}</span>
      <span className="ml-auto text-sm font-semibold text-parchment">{value}</span>
    </div>
  )
}
