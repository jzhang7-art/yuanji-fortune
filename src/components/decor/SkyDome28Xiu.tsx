import { useReducedMotion } from 'framer-motion'

/**
 * 中式天文仪器盘 — 完整 4 层同心环（24 节气 → 12 地支 → 二十八宿 → 四象）
 * 参考传统黄绢星图盘：金线分隔每环、二十八宿含星点连线、四象五行着色、4 道象限辐线
 * 中央镂空给分数数字。
 *
 * 双层逆向旋转：金色星宿顺时针 / 节气逆时针（CSS @keyframes）
 */

const JIE_QI = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒',
]
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
// 四神方位：朱雀(南/上)、玄武(北/下)、青龙(东/左)、白虎(西/右)
// SVG 坐标系：-90°=上, 0°=右, 90°=下, 180°=左
const SIXIANG = [
  { text: '青 龙', deg: 180, color: '#5a8a6a' },  // 左
  { text: '朱 雀', deg: -90, color: '#b23a2e' },  // 上
  { text: '白 虎', deg: 0, color: '#d8d4c8' },    // 右
  { text: '玄 武', deg: 90, color: '#4a6b8a' },   // 下
]

interface XiuDef {
  stars: [number, number][]
  lines: [number, number][]
  bright: number[]
}
const XIU_DEFS: XiuDef[] = [
  { stars: [[0,0.08],[0,-0.08]], lines: [[0,1]], bright: [0] },
  { stars: [[-0.06,0.10],[-0.06,0.03],[-0.06,-0.03],[-0.06,-0.10]], lines: [[0,1],[1,2],[2,3]], bright: [1] },
  { stars: [[-0.05,0.08],[0.05,0.08],[0.05,-0.08],[-0.05,-0.08]], lines: [[0,1],[1,2],[2,3],[3,0]], bright: [0] },
  { stars: [[-0.08,0.06],[-0.04,0.08],[0.04,-0.06],[0.08,-0.08]], lines: [[0,1],[1,2],[2,3]], bright: [1] },
  { stars: [[-0.10,0],[0,0],[0.10,0]], lines: [[0,1],[1,2]], bright: [1] },
  { stars: [[-0.08,0.12],[-0.04,0.14],[0.02,0.13],[0.06,0.09],[0.08,0.04],[0.08,-0.02],[0.05,-0.08],[0.01,-0.12],[-0.04,-0.12]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]], bright: [4] },
  { stars: [[-0.06,0.06],[0.06,0.06],[0.10,-0.06],[-0.10,-0.06]], lines: [[0,1],[1,2],[2,3],[3,0]], bright: [0] },
  { stars: [[-0.10,0.04],[-0.06,0.10],[0,0.10],[0.06,0.06],[0.08,-0.02],[0.04,-0.10]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[0,3]], bright: [3] },
  { stars: [[-0.06,0.10],[0,0.10],[0.06,0.06],[0.04,-0.06],[-0.04,-0.10],[-0.10,-0.04]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]], bright: [1] },
  { stars: [[-0.06,0.04],[0,0],[0.06,0.04],[0,-0.10]], lines: [[0,1],[1,2],[1,3]], bright: [1] },
  { stars: [[-0.07,0],[0.07,0]], lines: [[0,1]], bright: [0] },
  { stars: [[-0.07,0.04],[0.07,0.04],[0,-0.07]], lines: [[0,2],[1,2]], bright: [2] },
  { stars: [[-0.07,0.04],[0.07,-0.04]], lines: [[0,1]], bright: [0] },
  { stars: [[-0.06,0.04],[0.06,-0.04]], lines: [[0,1]], bright: [0] },
  { stars: [[-0.10,0.08],[-0.04,0.13],[0.04,0.13],[0.10,0.08],[0.12,0],[0.08,-0.08],[0,-0.12],[-0.08,-0.08]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]], bright: [0,4] },
  { stars: [[-0.08,0],[0,0.04],[0.08,0]], lines: [[0,1],[1,2]], bright: [1] },
  { stars: [[-0.05,0.06],[0.05,0.06],[0,-0.06]], lines: [[0,1],[1,2],[2,0]], bright: [0] },
  { stars: [[0,0.12],[0.04,0.08],[0.08,0.04],[-0.04,0.08],[-0.08,0.06],[-0.06,0.02],[0.02,0.02]], lines: [[0,1],[0,3],[1,2],[1,6],[3,4],[4,5],[5,6]], bright: [0,1,3] },
  { stars: [[-0.10,0.10],[-0.06,0.06],[0,0.04],[0.06,0.06],[0.10,0.10],[0.04,-0.02],[0.06,-0.08],[0.10,-0.12]], lines: [[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[6,7]], bright: [2,5] },
  { stars: [[-0.04,0.05],[0.04,0.05],[0,-0.04]], lines: [[0,1],[0,2],[1,2]], bright: [0] },
  { stars: [[-0.08,0.10],[0.08,0.10],[-0.05,0.02],[0,0.02],[0.05,0.02],[-0.08,-0.10],[0.08,-0.10]], lines: [[0,2],[1,4],[2,3],[3,4],[2,5],[4,6]], bright: [0,1,5,6] },
  { stars: [[-0.10,0.06],[-0.04,0.10],[0.04,0.10],[0.10,0.06],[0.10,-0.06],[0.04,-0.10],[-0.04,-0.10],[-0.10,-0.06]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]], bright: [0,3] },
  { stars: [[-0.08,0.06],[0.08,0.06],[0.08,-0.06],[-0.08,-0.06],[0,0]], lines: [[0,4],[1,4],[2,4],[3,4]], bright: [4] },
  { stars: [[-0.10,0.04],[-0.08,0.10],[-0.04,0.13],[0.02,0.12],[0.06,0.08],[0.08,0.02],[0.06,-0.04],[0.02,-0.08]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]], bright: [3] },
  { stars: [[0,0.10],[0.07,0.07],[0.10,0],[0.07,-0.07],[0,-0.10],[-0.07,-0.07],[-0.10,0]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0]], bright: [0,2] },
  { stars: [[-0.06,0.08],[0.06,0.08],[0.10,0],[0.06,-0.08],[-0.06,-0.08],[-0.10,0]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]], bright: [0,2] },
  { stars: [[-0.12,0.06],[-0.06,0.12],[0,0.14],[0.06,0.12],[0.12,0.06],[0.12,-0.02],[0.04,-0.08],[-0.04,-0.08],[-0.12,-0.02]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,0]], bright: [2] },
  { stars: [[-0.06,0.06],[0.06,0.06],[0.08,-0.06],[-0.08,-0.06]], lines: [[0,1],[1,2],[2,3],[3,0]], bright: [0,1] },
]
const XIU_NAMES = [
  '角','亢','氐','房','心','尾','箕',
  '斗','牛','女','虚','危','室','壁',
  '奎','娄','胃','昴','毕','觜','参',
  '井','鬼','柳','星','张','翼','轸',
]

interface SkyDome28XiuProps {
  size?: number
  spinDuration?: number
}

export function SkyDome28Xiu({
  size = 380,
  spinDuration = 120,
}: SkyDome28XiuProps) {
  const reduced = useReducedMotion()
  const cx = size / 2
  const cy = size / 2

  const R_JIEQI = size * 0.485
  const R_DIZHI = size * 0.430
  const R_XIU = size * 0.358
  const R_SIXIANG = size * 0.255
  const R_CENTER = size * 0.14

  const STAR_SCALE = 90

  function ringChars(items: string[], r: number, fontSize: number, color: string, opacity = 0.7) {
    const step = 360 / items.length
    return items.map((ch, i) => {
      const ang = -90 + i * step
      const rad = (ang * Math.PI) / 180
      return (
        <text
          key={`r${r}-${i}`}
          x={cx + r * Math.cos(rad)}
          y={cy + r * Math.sin(rad)}
          fontSize={fontSize}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          opacity={opacity}
          style={{ fontFamily: '"Songti SC", "STSong", "KaiTi", serif' }}
        >
          {ch}
        </text>
      )
    })
  }

  function xiuStars() {
    const els: React.ReactNode[] = []
    XIU_DEFS.forEach((def, i) => {
      const angDeg = -90 + i * (360 / 28)
      const ang = (angDeg * Math.PI) / 180
      const cos = Math.cos(ang)
      const sin = Math.sin(ang)

      const ocx = cx + R_XIU * cos
      const ocy = cy + R_XIU * sin

      const starPx = def.stars.map(([dr, dt]) => ({
        x: ocx + STAR_SCALE * (dr * cos - dt * sin),
        y: ocy + STAR_SCALE * (dr * sin + dt * cos),
      }))

      def.lines.forEach(([from, to]) => {
        els.push(
          <line
            key={`xiu-${i}-ln-${from}-${to}`}
            x1={starPx[from].x} y1={starPx[from].y}
            x2={starPx[to].x} y2={starPx[to].y}
            stroke="var(--color-jin)"
            strokeWidth="0.35"
            opacity="0.5"
          />,
        )
      })

      starPx.forEach((pos, si) => {
        const isBright = def.bright.includes(si)
        els.push(
          <circle
            key={`xiu-${i}-st-${si}`}
            cx={pos.x} cy={pos.y}
            r={isBright ? 2.2 : 1.2}
            fill="var(--color-jin)"
            opacity={isBright ? 0.85 : 0.55}
          />,
        )
      })

      els.push(
        <text
          key={`xiu-${i}-name`}
          x={cx + (R_XIU + 14) * cos}
          y={cy + (R_XIU + 14) * sin}
          fontSize="8"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-jin)"
          opacity="0.7"
          style={{ fontFamily: '"Songti SC", "STSong", "KaiTi", serif' }}
        >
          {XIU_NAMES[i]}
        </text>,
      )
    })
    return els
  }

  function sixiangLabels() {
    return SIXIANG.map((sx) => {
      const rad = (sx.deg * Math.PI) / 180
      const x = cx + R_SIXIANG * Math.cos(rad)
      const y = cy + R_SIXIANG * Math.sin(rad)
      return (
        <text
          key={`sx-${sx.text}`}
          x={x} y={y}
          fontSize="14"
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="central"
          fill={sx.color}
          opacity="0.75"
          style={{ fontFamily: '"Songti SC", "STSong", "KaiTi", serif', letterSpacing: '0.12em' }}
        >
          {sx.text}
        </text>
      )
    })
  }

  // CSS keyframes 动画名
  const jieqiAnim = `skydome-jieqi-${spinDuration}`
  const xiuAnim = `skydome-xiu-${spinDuration}`

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <style>{`
        @keyframes ${jieqiAnim} {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes ${xiuAnim} {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* ── 分隔圆环（金线，静态） ── */}
        {[R_JIEQI + 10, R_JIEQI - 10, R_DIZHI + 10, R_DIZHI - 10, R_XIU + 20, R_XIU - 20, R_SIXIANG + 10, R_SIXIANG - 10].map((r, i) => (
          <circle
            key={`ring-${i}`}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="var(--color-jin)"
            strokeWidth={i % 2 === 0 ? 0.5 : 0.3}
            opacity={i % 2 === 0 ? 0.4 : 0.2}
          />
        ))}

        {/* ── 4 道象限分割线（静态） ── */}
        {[0, 90, 180, 270].map((angDeg) => {
          const rad = ((angDeg - 90) * Math.PI) / 180
          return (
            <line
              key={`spoke-${angDeg}`}
              x1={cx + R_CENTER * Math.cos(rad)}
              y1={cy + R_CENTER * Math.sin(rad)}
              x2={cx + (R_JIEQI + 12) * Math.cos(rad)}
              y2={cy + (R_JIEQI + 12) * Math.sin(rad)}
              stroke="var(--color-jin)"
              strokeWidth="0.3"
              strokeDasharray="2 4"
              opacity="0.3"
            />
          )
        })}

        {/* ── 地支 12 环（静态） ── */}
        {ringChars(DI_ZHI, R_DIZHI, 12, 'var(--color-jin-bright)', 0.85)}

        {/* ── 四象（静态） ── */}
        {sixiangLabels()}

        {/* ── 中央暗区（静态） ── */}
        <circle cx={cx} cy={cy} r={R_CENTER} fill="var(--color-ru-soft)" opacity="0.7" />

        {/* ═══════════════════════════════════════════ */}
        {/* 节气 24 环 — 逆时针旋转 */}
        {/* ═══════════════════════════════════════════ */}
        <g
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: reduced ? 'none' : `${jieqiAnim} ${spinDuration}s linear infinite`,
          }}
        >
          {ringChars(JIE_QI, R_JIEQI, 9, 'var(--color-qingmo)', 0.6)}
        </g>

        {/* ═══════════════════════════════════════════ */}
        {/* 二十八宿星点 + 连线 + 宿名 — 顺时针旋转 */}
        {/* ═══════════════════════════════════════════ */}
        <g
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: reduced ? 'none' : `${xiuAnim} ${spinDuration}s linear infinite`,
          }}
        >
          {xiuStars()}
        </g>
      </svg>
    </div>
  )
}
