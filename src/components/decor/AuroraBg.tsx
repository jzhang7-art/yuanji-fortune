import { useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Aurora from '@/lib/react-bits/Aurora'

/**
 * Aurora 天光带 — 用作 hero 区域 mesh 渐变背景
 * 4 色窄带（汝窑深墨 → 石青 → 金 → 朱砂），speed 0.5（半速）避免眩晕。
 *
 * 降级路径：
 * - prefers-reduced-motion → 渲染静态 SVG `<linearGradient>`（同色 stops 凝固版）
 * - WebGL 不可用（旧设备、Webview 限制） → 同样切静态 SVG
 *
 * 性能注意：Aurora 是 ogl WebGL canvas，与 R3F TianwenChart 双 canvas 共存。
 * 实测后若 GPU 抖动可调小 size 或直接走静态 SVG fallback。
 */
const COLOR_STOPS = [
  '#1a2228', // 汝窑深墨（底）
  '#4a7396', // 石青
  '#c8a45c', // 金
  '#b23a2e', // 朱砂
]

function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function AuroraBg({
  amplitude = 0.6,
  blend = 0.5,
  speed = 0.5,
}: {
  amplitude?: number
  blend?: number
  speed?: number
}) {
  const reduced = useReducedMotion()
  const [webglOk, setWebglOk] = useState(true)

  useEffect(() => {
    setWebglOk(hasWebGL())
  }, [])

  // 降级：reduced-motion 或 WebGL 失败 → 静态 SVG mesh 渐变
  if (reduced || !webglOk) {
    return <AuroraStaticFallback />
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 opacity-55">
      <Aurora colorStops={COLOR_STOPS} amplitude={amplitude} blend={blend} speed={speed} />
    </div>
  )
}

function AuroraStaticFallback() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-55"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <defs>
        <radialGradient id="aurora-static" cx="35%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#c8a45c" stopOpacity="0.55" />
          <stop offset="30%" stopColor="#4a7396" stopOpacity="0.35" />
          <stop offset="65%" stopColor="#b23a2e" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1a2228" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="url(#aurora-static)" />
    </svg>
  )
}
