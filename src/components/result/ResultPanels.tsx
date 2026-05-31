import type { BaZiChart } from '@/domain/bazi'
import type { Forecast } from '@/domain/scoring'
import { Card, ElementBadge, Pill, ScoreBar, QiChangPill } from '@/components/ui'
import { Reveal } from '@/motion/Reveal'
import { formatDate } from '@/util'

export interface ResultPanelsProps {
  chart: BaZiChart
  forecast: Forecast
}

/**
 * 免费面板：今日最佳发布时辰。
 * 与 ResultHero 一起构成「免费看完一次单期测算」的核心交付。
 */
export function ResultPanelBestHour({ forecast }: { forecast: Forecast }) {
  const { target } = forecast
  const bestHour = forecast.bestHours[0]
  const topIdx = bestHour?.shiChenIndex
  const candidateIdx = new Set(forecast.bestHours.slice(1, 3).map((h) => h.shiChenIndex))

  return (
    <Reveal>
      <Card title="今日最佳发布时辰" subtitle={`首选 ${bestHour.name}`}>
        <div className="mb-3 rounded-xl bg-ru-deep p-3 text-center">
          <span className="text-sm text-qingmo">流量最旺时段</span>
          <div className="text-xl font-semibold text-jin-bright">
            {bestHour.name} {bestHour.range}
          </div>
          <span className="text-xs text-qingmo">综合发布指数 {bestHour.score}</span>
        </div>
        {bestHour.reasons.length > 0 && (
          <ul className="mb-3 rounded-xl border border-shiqing/12 bg-ru-deep/60 px-3 py-2 text-xs leading-relaxed text-qingmo">
            {bestHour.reasons.map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-2">
          {target.hours.map((h, i) => (
            <div key={h.shiChenIndex} className="flex items-center gap-2">
              <span className="flex w-24 shrink-0 flex-col">
                <span className="relative inline-block text-xs text-qingmo">
                  {h.name}
                  {h.shiChenIndex === topIdx && (
                    <span
                      className="absolute -right-3 -top-2 rotate-[-12deg] select-none rounded-[3px] border border-zhusha-bright/80 bg-zhusha-bright/15 px-[3px] text-[10px] font-bold leading-[1.5] text-zhusha-bright"
                      title="首选时辰"
                    >
                      荐
                    </span>
                  )}
                  {candidateIdx.has(h.shiChenIndex) && (
                    <span
                      className="absolute -right-3 -top-2 rotate-[-12deg] select-none rounded-[3px] border border-shiqing/70 bg-shiqing/12 px-[3px] text-[10px] font-bold leading-[1.5] text-shiqing"
                      title="次宜时辰"
                    >
                      宜
                    </span>
                  )}
                </span>
                <span className="text-[10px] tabular-nums text-qingmo-mute">{h.range}</span>
              </span>
              <div className="flex-1">
                <ScoreBar value={h.score} delay={0.05 + i * 0.04} />
              </div>
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-mibai">
                {h.score}
              </span>
              <span className="flex w-7 shrink-0 justify-center">
                {h.lowTraffic && (
                  <span
                    aria-label="平台流量低谷"
                    title="平台流量低谷"
                    className="rounded border border-qingmo-mute/40 bg-white/5 px-1 text-[10px] font-semibold leading-[1.6] text-qingmo-mute"
                  >
                    低
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </Reveal>
  )
}

/**
 * 锁后面板：运势构成 / 八字简析 / 当日黄历 / 奇门遁甲 / 未来 N 天吉日。
 * 用 LockedSection 包裹后，未兑换邀请码用户看到兑换卡。
 */
export function ResultPanelsLocked({ chart, forecast }: ResultPanelsProps) {
  const { target } = forecast
  const bestHour = forecast.bestHours[0]
  const topDayDates = new Set(forecast.bestDays.slice(0, 3).map((d) => d.date))
  const bestDay = forecast.bestDays[0]
  const forecastDays = forecast.futureDays.length

  return (
    <>
      <Reveal delay={0.05}>
        <Card title="运势构成" subtitle="四维加权">
          <div className="flex flex-col gap-3">
            <ScoreBar label="八字运势 · 喜用契合" value={target.baziDayScore} delay={0.1} />
            <ScoreBar label="黄历气场 · 当日传播气场" value={target.huangli.score} delay={0.2} />
            <ScoreBar label="奇门时局 · 全日均值" value={target.qimenAvg} delay={0.3} />
            <ScoreBar label="视频五行 · 类型契合" value={target.videoScore} delay={0.4} />
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <Card title="八字简析">
          <div className="grid grid-cols-4 gap-2">
            {[chart.year, chart.month, chart.day, chart.time].map((p) => (
              <div key={p.label} className="rounded-xl bg-ru-deep py-2 text-center">
                <div className="text-[11px] text-qingmo">{p.label}</div>
                <div className="text-lg font-semibold text-jin-bright">{p.gan}</div>
                <div className="text-lg font-semibold text-mibai">{p.zhi}</div>
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
        </Card>
      </Reveal>

      <Reveal>
        <Card title="当日黄历" subtitle={`${target.dayGanZhi}日`}>
          <div className="mb-2">
            <QiChangPill qiChang={target.huangli.qiChang} />
          </div>
          <p className="text-sm leading-relaxed text-qingmo">
            {target.huangli.qiChang.reading}
          </p>
          <p className="mt-2 text-xs text-qingmo">
            择吉判据：{target.huangli.tianShen}
            {target.huangli.tianShenType} · {target.huangli.zhiXing}日 · {target.huangli.xiu}宿（
            {target.huangli.xiuLuck}）
          </p>
          <div className="mt-3 flex flex-col gap-1 border-t border-shiqing/12 pt-3 text-xs text-qingmo-mute">
            <span>
              利传播宜：
              <span className="text-shilv">{target.huangli.matchedYi.join('、') || '今日无'}</span>
            </span>
            <span>
              忌传播：
              <span className="text-zhusha-bright">
                {target.huangli.matchedJi.join('、') || '今日无'}
              </span>
            </span>
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <Card
          title="奇门遁甲时局"
          subtitle={`${bestHour.name} ${bestHour.range} · ${bestHour.qimen.chart.dunType}${bestHour.qimen.chart.juShu}局`}
        >
          <p className="text-sm leading-relaxed text-mibai">{bestHour.qimen.summary}</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {bestHour.qimen.highlights.map((h) => (
              <div key={h.label} className="flex items-center justify-between text-xs">
                <span className="text-qingmo">{h.label}</span>
                <span className="text-jin-bright">{h.quality} 分</span>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      {forecastDays > 1 && (
        <Reveal>
          <Card
            title={`未来 ${forecastDays} 天发布吉日`}
            subtitle={`首选 ${formatDate(bestDay.date)}`}
          >
            <div className="mb-3 rounded-xl bg-ru-deep p-3 text-center">
              <span className="text-sm text-qingmo">流量最旺日期</span>
              <div className="text-xl font-semibold text-jin-bright">
                {formatDate(bestDay.date)} {bestDay.weekday}
              </div>
              <span className="text-xs text-qingmo">
                {bestDay.dayGanZhi}日 · 综合指数 {bestDay.score}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {forecast.futureDays.map((d, i) => (
                <div key={d.date} className="flex items-center gap-2">
                  <span className="w-20 shrink-0">
                    <span className="relative inline-block text-xs text-qingmo">
                      {formatDate(d.date)} {d.weekday}
                      {topDayDates.has(d.date) && (
                        <span
                          className="absolute -right-3 -top-2 rotate-[-12deg] select-none rounded-[3px] border border-zhusha-bright/80 bg-zhusha-bright/15 px-[3px] text-[10px] font-bold leading-[1.5] text-zhusha-bright"
                          title="推荐吉日"
                        >
                          吉
                        </span>
                      )}
                    </span>
                  </span>
                  <div className="flex-1">
                    <ScoreBar value={d.score} delay={0.05 + i * 0.03} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs tabular-nums text-mibai">
                    {d.score}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      )}
    </>
  )
}
