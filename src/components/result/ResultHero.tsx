import { motion, useReducedMotion } from 'framer-motion'
import type { Decision, Forecast } from '@/domain/scoring'
import type { VideoType } from '@/data/videoTypes'
import type { PublishInfo } from '@/types'
import { Card, Pill } from '@/components/ui'
import { ProbabilityGauge } from '@/components/ProbabilityGauge'
import { SunRayDeco } from '@/components/result/SunRayDeco'
import { ZodiacRing } from '@/components/result/ZodiacRing'
import { spring } from '@/motion/transitions'
import { formatDate } from '@/util'
import { GRADE_TONE, VERDICT_HEADLINE, decisionAdvice } from '@/data/resultDisplay'
import DecryptedText from '@/lib/react-bits/DecryptedText'

export interface ResultHeroProps {
  forecast: Forecast
  decision: Decision
  video: VideoType
  publishInfo: PublishInfo
}

export function ResultHero({ forecast, decision, video, publishInfo }: ResultHeroProps) {
  const { target } = forecast
  const reduced = useReducedMotion()

  // reduced 时所有延迟/动画归零，避免 prefers-reduced-motion 用户长时间看到空白
  const t = (delay: number, base: object = spring) =>
    reduced ? { duration: 0 } : { ...base, delay }
  const initial = reduced ? false : undefined

  return (
    <motion.div
      initial={initial || { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={t(0.1)}
    >
      <Card className="flex flex-col items-center">
        <div className="mb-2 flex flex-wrap justify-center gap-2">
          <Pill tone="jin">
            {video.icon} {video.name}
          </Pill>
          <Pill tone="soft">{formatDate(publishInfo.targetDate)} 发布</Pill>
          <Pill tone="soft">{publishInfo.platform}</Pill>
        </div>
        {/* 仪表盘 + 外圈装饰：SunRayDeco 12 道金光芒 + ZodiacRing 十二时辰圆周刻度 */}
        <div className="relative flex items-center justify-center" style={{ width: 296, height: 296 }}>
          <SunRayDeco size={296} />
          <ZodiacRing size={280} radius={128} />
          <ProbabilityGauge value={target.overall} />
        </div>
        <motion.div
          className={`mt-3 rounded-full border px-4 py-1 text-sm font-semibold ${
            GRADE_TONE[decision.grade.tone] ?? GRADE_TONE.parchment
          }`}
          initial={initial || { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={t(1.0)}
        >
          {decision.grade.label}
        </motion.div>
        {/* VERDICT_HEADLINE 用 DecryptedText 滚字符揭示（仅触发 1 次，落定金色） */}
        <motion.div
          className="mt-2 text-center text-base font-semibold text-jin-bright"
          initial={initial || { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 1.1 }}
        >
          <DecryptedText
            text={VERDICT_HEADLINE[decision.verdict]}
            speed={70}
            maxIterations={10}
            sequential
            revealDirection="center"
            animateOn="view"
            useOriginalCharsOnly
            className="text-jin-bright"
            encryptedClassName="text-qingmo opacity-60"
          />
        </motion.div>
        <motion.p
          className="mt-1 text-center text-sm leading-relaxed text-qingmo"
          initial={initial || { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 1.2 }}
        >
          {decisionAdvice(decision)}
        </motion.p>
      </Card>
    </motion.div>
  )
}
