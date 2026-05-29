import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppState } from '@/state/AppState'
import { useBaZiChart } from '@/hooks/useBaZiChart'
import { buildDecision, computeForecast } from '@/domain/scoring'
import { getVideoType } from '@/data/videoTypes'
import { saveHistory } from '@/storage'
import { ShareCardModal } from '@/components/ShareCardModal'
import { FortuneScene } from '@/components/decor/FortuneScene'
import { Reveal } from '@/motion/Reveal'
import { ResultHero } from '@/components/result/ResultHero'
import { ResultPanelBestHour, ResultPanelsLocked } from '@/components/result/ResultPanels'
import { LockedSection } from '@/components/LockedSection'

export function ResultPage() {
  const navigate = useNavigate()
  const { baziInput, publishInfo } = useAppState()
  const chart = useBaZiChart()
  const saved = useRef(false)
  const [shareOpen, setShareOpen] = useState(false)

  const data = useMemo(() => {
    if (!chart || !publishInfo) return null
    const video = getVideoType(publishInfo.videoTypeId)
    if (!video) return null
    const forecast = computeForecast(
      chart,
      video,
      publishInfo.targetDate,
      publishInfo.platform,
    )
    return { forecast, video }
  }, [chart, publishInfo])

  useEffect(() => {
    if (!data || !baziInput || !publishInfo || saved.current) return
    saved.current = true
    void saveHistory({
      id: `${Date.now()}`,
      createdAt: Date.now(),
      baziInput,
      publishInfo,
      overallScore: data.forecast.target.overall,
    })
  }, [data, baziInput, publishInfo])

  if (!baziInput || !publishInfo || !data || !chart) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-qingmo">尚无测算数据</p>
        <button
          type="button"
          onClick={() => navigate('/bazi')}
          className="cursor-pointer rounded-xl border border-jin/40 px-6 py-2.5 text-jin-bright transition hover:bg-jin/10 active:scale-[0.98]"
        >
          去测算
        </button>
      </div>
    )
  }

  const { forecast, video } = data
  const decision = buildDecision(forecast)

  return (
    <FortuneScene tone="yunwen">
      <div className="flex flex-col gap-4">
        <ResultHero
          forecast={forecast}
          decision={decision}
          video={video}
          publishInfo={publishInfo}
        />

        <ResultPanelBestHour forecast={forecast} />

        <LockedSection
          feature="result_panels"
          title="解锁完整 7 张面板"
          subtitle="八字简析、运势构成四维、当日黄历宜忌、奇门时局、未来吉日—— 兑换邀请码后一并展开。"
        >
          <ResultPanelsLocked chart={chart} forecast={forecast} />
        </LockedSection>

        <Reveal>
          <motion.button
            type="button"
            onClick={() => setShareOpen(true)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            className="w-full cursor-pointer rounded-xl bg-gradient-to-b from-jin-bright to-jin py-3.5 text-base font-semibold text-ru shadow-lg shadow-jin/20"
          >
            生成分享卡片
          </motion.button>
        </Reveal>

        <Reveal>
          <div className="flex gap-3">
            <motion.button
              type="button"
              onClick={() => navigate('/publish')}
              whileTap={{ scale: 0.97 }}
              className="flex-1 cursor-pointer rounded-xl border border-shiqing/40 py-3 text-shiqing transition hover:bg-shiqing/10"
            >
              换内容重测
            </motion.button>
            <motion.button
              type="button"
              onClick={() => navigate('/bazi')}
              whileTap={{ scale: 0.97 }}
              className="flex-1 cursor-pointer rounded-xl border border-shiqing/20 py-3 text-qingmo transition hover:bg-white/5"
            >
              换八字
            </motion.button>
          </div>
        </Reveal>

        <p className="px-2 text-center text-xs leading-relaxed text-zhusha-bright/90">
          玄学推演仅供娱乐参考。真正决定内容流量的，是选题、品质与持续创作。
        </p>

        {shareOpen && (
          <ShareCardModal
            forecast={forecast}
            video={video}
            decision={decision}
            publishInfo={publishInfo}
            onClose={() => setShareOpen(false)}
          />
        )}
      </div>
    </FortuneScene>
  )
}
