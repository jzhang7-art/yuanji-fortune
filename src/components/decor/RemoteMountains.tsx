/**
 * 远山线描背景层 — 借鉴《千里江山图》《早春图》远景峰峦
 * 全屏宽度、固定底部、低透明度、纯静态骨架（不动不旋转）。
 * 多层叠加：最远层最淡，近层略浓，构成层次。
 */
export function RemoteMountains() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-0 flex w-full justify-center"
    >
      <svg
        width="100%"
        height="320"
        viewBox="0 0 800 320"
        preserveAspectRatio="xMidYMax slice"
        className="text-shiqing"
      >
        {/* 远山第一层（最淡） */}
        <path
          d="M0 240 L40 220 L80 235 L120 200 L160 215 L210 180 L260 200 L310 175 L360 195 L410 165 L460 190 L510 170 L560 195 L610 175 L670 200 L720 185 L780 210 L800 200 L800 320 L0 320 Z"
          fill="currentColor"
          opacity="0.035"
        />
        {/* 远山第二层（中淡） */}
        <path
          d="M0 280 L60 260 L120 275 L180 245 L240 265 L300 235 L360 260 L420 230 L480 255 L540 235 L600 260 L660 245 L720 270 L800 255 L800 320 L0 320 Z"
          fill="currentColor"
          opacity="0.05"
        />
        {/* 远山第三层（最近，最浓但仍极淡） */}
        <path
          d="M0 305 L80 290 L160 300 L240 280 L320 295 L400 275 L480 295 L560 280 L640 300 L720 290 L800 300 L800 320 L0 320 Z"
          fill="currentColor"
          opacity="0.075"
        />
        {/* 远山轮廓线（极细笔锋） */}
        <path
          d="M0 240 L40 220 L80 235 L120 200 L160 215 L210 180 L260 200 L310 175 L360 195 L410 165 L460 190 L510 170 L560 195 L610 175 L670 200 L720 185 L780 210 L800 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.7"
          opacity="0.15"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
