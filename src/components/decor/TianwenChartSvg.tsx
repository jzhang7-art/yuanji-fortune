/**
 * SVG 版三环天文圆盘 — 作为 R3F 失败时的降级 fallback
 * 内容与原 TianwenChart 保持一致；唯一改动:模块名分离。
 */

const XIU = [
  '角', '亢', '氐', '房', '心', '尾', '箕',
  '斗', '牛', '女', '虚', '危', '室', '壁',
  '奎', '娄', '胃', '昴', '毕', '觜', '参',
  '井', '鬼', '柳', '星', '张', '翼', '轸',
]

const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const FANGWEI = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']

export function TianwenChartSvgFallback({
  size = 380,
  xiuOpacity = 0.32,
  ringOpacity = 0.4,
  highlightIdx,
  bareInner,
}: {
  size?: number
  xiuOpacity?: number
  ringOpacity?: number
  highlightIdx?: number
  bareInner?: boolean
}) {
  const rOuter = 190
  const rMid = 150
  const rInner = 110
  const rCore = 40

  return (
    <svg width={size} height={size} viewBox="-200 -200 400 400" className="text-shiqing" aria-hidden>
      {/* 外层 3 道环：bareInner 时隐藏，核心环始终保留 */}
      {!bareInner && <circle cx={0} cy={0} r={rOuter} fill="none" stroke="currentColor" strokeWidth="0.6" opacity={ringOpacity} />}
      {!bareInner && <circle cx={0} cy={0} r={rMid} fill="none" stroke="currentColor" strokeWidth="0.5" opacity={ringOpacity * 0.85} />}
      {!bareInner && <circle cx={0} cy={0} r={rInner} fill="none" stroke="currentColor" strokeWidth="0.5" opacity={ringOpacity * 0.85} />}
      <circle cx={0} cy={0} r={rCore} fill="none" stroke="currentColor" strokeWidth="0.6" opacity={ringOpacity} />

      {/* 时辰文字（bareInner 时隐藏） */}
      {!bareInner && SHICHEN.map((sc, i) => {
        const angle = ((i * 30 - 90) * Math.PI) / 180
        const x = (rOuter + 7) * Math.cos(angle)
        const y = (rOuter + 7) * Math.sin(angle)
        return (
          <text key={`sc-${sc}`} x={x} y={y} fontSize="11" textAnchor="middle" dominantBaseline="middle"
            fill="currentColor" fontFamily="Noto Serif SC, STSong, serif" opacity={xiuOpacity * 0.85}>
            {sc}
          </text>
        )
      })}

      {XIU.map((name, i) => {
        const angle = ((i * (360 / 28) - 90) * Math.PI) / 180
        const xLabel = ((rMid + rInner) / 2) * Math.cos(angle)
        const yLabel = ((rMid + rInner) / 2) * Math.sin(angle)
        const xStar = rMid * Math.cos(angle)
        const yStar = rMid * Math.sin(angle)
        const isHi = highlightIdx === i
        return (
          <g key={`xiu-${name}`}>
            <circle cx={xStar} cy={yStar} r={isHi ? 3 : 1.4}
              fill={isHi ? 'var(--color-zhusha-bright)' : 'currentColor'} opacity={isHi ? 1 : xiuOpacity} />
            <text x={xLabel} y={yLabel} fontSize="9" textAnchor="middle" dominantBaseline="middle"
              fill="currentColor" fontFamily="Noto Serif SC, STSong, serif" opacity={xiuOpacity}>
              {name}
            </text>
          </g>
        )
      })}

      {/* 方位文字 + 象限虚线（bareInner 时隐藏） */}
      {!bareInner && FANGWEI.map((dir, i) => {
        const angle = ((i * 45 - 90) * Math.PI) / 180
        const x = (rInner - 18) * Math.cos(angle)
        const y = (rInner - 18) * Math.sin(angle)
        return (
          <text key={`fw-${dir}`} x={x} y={y} fontSize="8" textAnchor="middle" dominantBaseline="middle"
            fill="currentColor" fontFamily="Noto Serif SC, STSong, serif" opacity={xiuOpacity * 0.75}>
            {dir}
          </text>
        )
      })}

      {!bareInner && <line x1={0} y1={-rOuter} x2={0} y2={rOuter} stroke="currentColor" strokeWidth="0.4" opacity={ringOpacity * 0.5} strokeDasharray="2 6" />}
      {!bareInner && <line x1={-rOuter} y1={0} x2={rOuter} y2={0} stroke="currentColor" strokeWidth="0.4" opacity={ringOpacity * 0.5} strokeDasharray="2 6" />}

      <line x1={-8} y1={0} x2={8} y2={0} stroke="var(--color-zhusha-bright)" strokeWidth="0.8" opacity="0.6" />
      <line x1={0} y1={-8} x2={0} y2={8} stroke="var(--color-zhusha-bright)" strokeWidth="0.8" opacity="0.6" />
      <circle cx={0} cy={0} r={2.5} fill="var(--color-zhusha-bright)" opacity="0.85" />
    </svg>
  )
}
