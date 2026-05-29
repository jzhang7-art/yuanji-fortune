import { motion } from 'framer-motion'
import { TianwenChart } from './TianwenChart'

const XIU = [
  '角', '亢', '氐', '房', '心', '尾', '箕',
  '斗', '牛', '女', '虚', '危', '室', '壁',
  '奎', '娄', '胃', '昴', '毕', '觜', '参',
  '井', '鬼', '柳', '星', '张', '翼', '轸',
]

type Tone = 'gold' | 'parchment' | 'cinnabar'

const TONE_COLOR: Record<Tone, { main: string; sub: string }> = {
  gold: { main: 'var(--color-jin-bright)', sub: 'var(--color-jin)' },
  parchment: { main: 'var(--color-mibai)', sub: 'var(--color-qingmo)' },
  cinnabar: { main: 'var(--color-zhusha-bright)', sub: 'var(--color-zhusha)' },
}

// 中央分数 / 评级用渐变（顶亮 → 底暗），分 tone 三套，clarity 同时 text-shadow 强化
const TONE_GRADIENT: Record<Tone, { score: string; verdict: string }> = {
  gold: {
    score: 'linear-gradient(180deg, #f4dc9b 0%, #c8a45c 100%)',
    verdict: 'linear-gradient(180deg, #e6c878 0%, #b08540 100%)',
  },
  parchment: {
    // 中庸 tone：用金亮 → 米白渐变（保留温暖感 + 清晰）
    score: 'linear-gradient(180deg, #f4dc9b 0%, #d8d0c2 100%)',
    verdict: 'linear-gradient(180deg, #e6c878 0%, #8a9098 100%)',
  },
  cinnabar: {
    score: 'linear-gradient(180deg, #e8746b 0%, #8b2a20 100%)',
    verdict: 'linear-gradient(180deg, #d4524a 0%, #7a2520 100%)',
  },
}

export function TianwenHero({
  dayGanZhi: _dayGanZhi,
  verdict,
  subVerdict,
  tone,
  score,
  xiuName,
  delay = 0,
  transparent = false,
  bareInner,
  hideChart,
}: {
  dayGanZhi: string
  verdict: string
  subVerdict?: string
  tone: Tone
  score: number
  xiuName?: string
  delay?: number
  transparent?: boolean
  bareInner?: boolean
  hideChart?: boolean
}) {
  const color = TONE_COLOR[tone]
  const gradient = TONE_GRADIENT[tone]
  const size = 348

  const xiuIdx = xiuName ? XIU.indexOf(xiuName) : -1
  const idx = xiuIdx >= 0 ? xiuIdx : undefined

  const containerCls = transparent
    ? 'relative flex items-center justify-center'
    : 'jin-gilt relative flex items-center justify-center overflow-hidden rounded-3xl border border-jin/25 bg-ru-soft'

  return (
    <div
      className={containerCls}
      style={{ minHeight: size + 32 }}
    >
      {!hideChart && (
        <div className="pointer-events-none" style={{ width: size, height: size }}>
          <TianwenChart size={size} highlightIdx={idx} bareInner={bareInner} />
        </div>
      )}

      {/* 中央文字层：分数居中主角 + 评级在下 + 副词底部 */}
      <div className="pointer-events-none absolute inset-0">
        {/* 分数+% 居中主角 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="num flex items-baseline"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: delay + 0.25 }}
            style={{
              // 整组让"暗底"先压住浑天仪经纬线再上数字（drop-shadow filter 比 textShadow 更纯净）
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.85)) drop-shadow(0 0 16px rgba(0,0,0,0.5))',
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                // 金渐变文字：background-clip text，需指定 color: transparent
                background: gradient.score,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              {score}
            </span>
            <span
              style={{
                fontSize: 24,
                fontWeight: 500,
                marginLeft: 3,
                lineHeight: 1,
                background: gradient.score,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                opacity: 0.85,
              }}
            >
              %
            </span>
          </motion.div>

          {/* 评级在分数正下方，渐变金字 */}
          <motion.span
            className="font-serif-cn mt-2"
            style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '0.24em',
              lineHeight: 1,
              background: gradient.verdict,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))',
            }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: delay + 0.40 }}
          >
            {verdict}
          </motion.span>
        </div>

        {/* 副判词底部锚点 */}
        {subVerdict && (
          <motion.span
            className="font-serif-cn absolute left-0 right-0 text-center text-[13px]"
            style={{
              bottom: '18%',
              color: color.sub,
              opacity: 0.88,
              letterSpacing: '0.28em',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.88 }}
            transition={{ duration: 0.5, delay: delay + 0.65 }}
          >
            · {subVerdict} ·
          </motion.span>
        )}
      </div>
    </div>
  )
}
