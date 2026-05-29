import { memo, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { TianwenChart } from './TianwenChart'

export type FortuneTone = 'tianwen' | 'bagua' | 'jieqi' | 'ganzhi' | 'luopan' | 'yunwen'

/** 背景装饰层：在内容下方铺一层低透明度纹样，按页面切换 tone。 */
export function FortuneScene({ tone, children }: { tone: FortuneTone; children?: ReactNode }) {
  return (
    <div className="relative">
      <FortuneDecor tone={tone} />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// FortuneDecor 只依赖 tone（原语），用 memo 防止父组件 state 变化时重新渲染装饰层（含 R3F 场景）
const FortuneDecor = memo(function FortuneDecor({ tone }: { tone: FortuneTone }) {
  const reduced = useReducedMotion()

  if (tone === 'tianwen') {
    return (
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-10 left-1/2 z-0 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.18 }}
        transition={{ duration: 1.1, delay: 0.05 }}
      >
        <motion.div
          animate={reduced ? undefined : { rotate: 360 }}
          transition={reduced ? undefined : { duration: 240, repeat: Infinity, ease: 'linear' }}
        >
          <TianwenChart size={400} xiuOpacity={0.5} ringOpacity={0.55} />
        </motion.div>
      </motion.div>
    )
  }

  if (tone === 'bagua' || tone === 'luopan') {
    const slow = tone === 'luopan'
    return (
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-6 left-1/2 z-0 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: slow ? 0.05 : 0.06 }}
        transition={{ duration: 0.9, delay: 0.05 }}
      >
        <motion.div
          animate={reduced ? undefined : { rotate: slow ? -360 : 360 }}
          transition={
            reduced ? undefined : { duration: slow ? 120 : 60, repeat: Infinity, ease: 'linear' }
          }
        >
          <BaguaSvg />
        </motion.div>
      </motion.div>
    )
  }

  if (tone === 'jieqi') {
    return (
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-4 left-1/2 z-0 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.085 }}
        transition={{ duration: 0.9 }}
      >
        <motion.div
          animate={reduced ? undefined : { rotate: 360 }}
          transition={reduced ? undefined : { duration: 180, repeat: Infinity, ease: 'linear' }}
        >
          <JieqiSvg />
        </motion.div>
      </motion.div>
    )
  }

  if (tone === 'ganzhi') {
    return (
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-2 top-4 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.09 }}
        transition={{ duration: 0.9 }}
      >
        <GanZhiSvg />
      </motion.div>
    )
  }

  if (tone === 'yunwen') {
    return (
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.08 }}
        transition={{ duration: 1 }}
      >
        <YunwenSvg />
      </motion.div>
    )
  }

  return null
})

/* —— 八卦圆盘（V1 保留，作为 bagua tone 时使用） —— */
function BaguaSvg() {
  const trigrams = ['☰', '☱', '☲', '☳', '☷', '☶', '☵', '☴']
  return (
    <svg width={360} height={360} viewBox="-200 -200 400 400" className="text-shiqing">
      <circle r="180" stroke="currentColor" fill="none" strokeWidth="1.5" />
      <circle r="120" stroke="currentColor" fill="none" strokeWidth="0.8" />
      {trigrams.map((t, i) => {
        const angle = ((i * 45 - 90) * Math.PI) / 180
        const x = 150 * Math.cos(angle)
        const y = 150 * Math.sin(angle)
        return (
          <text
            key={t}
            x={x}
            y={y}
            fontSize="36"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="currentColor"
          >
            {t}
          </text>
        )
      })}
      <circle r="40" stroke="currentColor" fill="none" strokeWidth="1.2" />
      <path
        d="M0,-40 A20,20 0 0 1 0,0 A20,20 0 0 0 0,40 A40,40 0 0 1 0,-40 Z"
        fill="currentColor"
        opacity="0.45"
      />
      <circle cx="0" cy="-20" r="4" fill="rgba(0,0,0,0.4)" />
      <circle cx="0" cy="20" r="4" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

/* —— 二十四节气环 —— */
const JIEQI = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒',
]
function JieqiSvg() {
  return (
    <svg width={380} height={380} viewBox="-200 -200 400 400" className="text-shiqing">
      <circle r="190" stroke="currentColor" fill="none" strokeWidth="1" />
      <circle r="155" stroke="currentColor" fill="none" strokeWidth="0.6" />
      <circle r="60" stroke="currentColor" fill="none" strokeWidth="0.8" />
      {JIEQI.map((q, i) => {
        const angle = (i * 15 - 90) * (Math.PI / 180)
        const x = 173 * Math.cos(angle)
        const y = 173 * Math.sin(angle)
        const rotateDeg = i * 15
        return (
          <g key={q} transform={`rotate(${rotateDeg} ${x} ${y})`}>
            <text
              x={x}
              y={y}
              fontSize="13"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="currentColor"
              fontFamily="Noto Serif SC, STSong, serif"
              fontWeight="600"
            >
              {q}
            </text>
          </g>
        )
      })}
      {[0, 90, 180, 270].map((a) => {
        const rad = (a - 90) * (Math.PI / 180)
        return (
          <circle
            key={a}
            cx={60 * Math.cos(rad)}
            cy={60 * Math.sin(rad)}
            r={3}
            fill="currentColor"
          />
        )
      })}
    </svg>
  )
}

/* —— 天干地支竖排 —— */
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
function GanZhiSvg() {
  return (
    <svg width={120} height={460} viewBox="0 0 120 460" className="text-shiqing">
      <g fontFamily="Noto Serif SC, STSong, serif" fontWeight="600" fontSize="28" fill="currentColor">
        {TIANGAN.map((g, i) => (
          <text key={g} x="30" y={28 + i * 40} textAnchor="middle">
            {g}
          </text>
        ))}
        {DIZHI.map((z, i) => (
          <text key={z} x="90" y={20 + i * 36} textAnchor="middle">
            {z}
          </text>
        ))}
      </g>
    </svg>
  )
}

/* —— 祥云回纹 —— */
function YunwenSvg() {
  const cloud =
    'M0 10 q 8 -10 18 0 q 6 -8 14 -2 q 8 -4 14 2 q 8 -4 12 4 q -4 6 -12 4 q -4 6 -14 2 q -6 8 -14 0 q -10 10 -18 0 z'
  return (
    <svg width={400} height={70} viewBox="0 0 400 70" className="text-shiqing">
      <g fill="currentColor" opacity="0.85">
        {[0, 95, 195, 295].map((x) => (
          <g key={x} transform={`translate(${x} 12)`}>
            <path d={cloud} />
          </g>
        ))}
      </g>
      <path
        d="M0 56 q 12 -16 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.7"
      />
    </svg>
  )
}
