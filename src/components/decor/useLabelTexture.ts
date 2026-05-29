/**
 * 天文圆盘 28 宿 + 北斗 + 四象的 CanvasTexture 生成 hook。
 * highlightIdx 变化时重算并 dispose 旧 texture，组件卸载时一并 dispose。
 */
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

type ConstellationDef = {
  stars: [number, number][]
  lines: [number, number][]
  bright: number[]
}

const XIU_DATA: ConstellationDef[] = [
  /* 角(0) */ { stars: [[0, 0.08],[0, -0.08]], lines: [[0,1]], bright: [0] },
  /* 亢(1) */ { stars: [[-0.06, 0.10],[-0.06, 0.03],[-0.06, -0.03],[-0.06, -0.10]], lines: [[0,1],[1,2],[2,3]], bright: [1] },
  /* 氐(2) */ { stars: [[-0.05, 0.08],[0.05, 0.08],[0.05, -0.08],[-0.05, -0.08]], lines: [[0,1],[1,2],[2,3],[3,0]], bright: [0] },
  /* 房(3) */ { stars: [[-0.08, 0.06],[-0.04, 0.08],[0.04, -0.06],[0.08, -0.08]], lines: [[0,1],[1,2],[2,3]], bright: [1] },
  /* 心(4) */ { stars: [[-0.10, 0],[0, 0],[0.10, 0]], lines: [[0,1],[1,2]], bright: [1] },
  /* 尾(5) */ { stars: [[-0.08, 0.12],[-0.04, 0.14],[0.02, 0.13],[0.06, 0.09],[0.08, 0.04],[0.08, -0.02],[0.05, -0.08],[0.01, -0.12],[-0.04, -0.12]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]], bright: [4] },
  /* 箕(6) */ { stars: [[-0.06, 0.06],[0.06, 0.06],[0.10, -0.06],[-0.10, -0.06]], lines: [[0,1],[1,2],[2,3],[3,0]], bright: [0] },
  /* 斗(7) */ { stars: [[-0.10, 0.04],[-0.06, 0.10],[0, 0.10],[0.06, 0.06],[0.08, -0.02],[0.04, -0.10]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[0,3]], bright: [3] },
  /* 牛(8) */ { stars: [[-0.06, 0.10],[0, 0.10],[0.06, 0.06],[0.04, -0.06],[-0.04, -0.10],[-0.10, -0.04]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]], bright: [1] },
  /* 女(9) */ { stars: [[-0.06, 0.04],[0, 0],[0.06, 0.04],[0, -0.10]], lines: [[0,1],[1,2],[1,3]], bright: [1] },
  /* 虚(10)*/ { stars: [[-0.07, 0],[0.07, 0]], lines: [[0,1]], bright: [0] },
  /* 危(11)*/ { stars: [[-0.07, 0.04],[0.07, 0.04],[0, -0.07]], lines: [[0,2],[1,2]], bright: [2] },
  /* 室(12)*/ { stars: [[-0.07, 0.04],[0.07, -0.04]], lines: [[0,1]], bright: [0] },
  /* 壁(13)*/ { stars: [[-0.06, 0.04],[0.06, -0.04]], lines: [[0,1]], bright: [0] },
  /* 奎(14)*/ { stars: [[-0.10, 0.08],[-0.04, 0.13],[0.04, 0.13],[0.10, 0.08],[0.12, 0],[0.08, -0.08],[0, -0.12],[-0.08, -0.08]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]], bright: [0, 4] },
  /* 娄(15)*/ { stars: [[-0.08, 0],[0, 0.04],[0.08, 0]], lines: [[0,1],[1,2]], bright: [1] },
  /* 胃(16)*/ { stars: [[-0.05, 0.06],[0.05, 0.06],[0, -0.06]], lines: [[0,1],[1,2],[2,0]], bright: [0] },
  /* 昴(17)*/ { stars: [[0, 0.12],[0.04, 0.08],[0.08, 0.04],[-0.04, 0.08],[-0.08, 0.06],[-0.06, 0.02],[0.02, 0.02]], lines: [[0,1],[0,3],[1,2],[1,6],[3,4],[4,5],[5,6]], bright: [0, 1, 3] },
  /* 毕(18)*/ { stars: [[-0.10, 0.10],[-0.06, 0.06],[0, 0.04],[0.06, 0.06],[0.10, 0.10],[0.04, -0.02],[0.06, -0.08],[0.10, -0.12]], lines: [[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[6,7]], bright: [2, 5] },
  /* 觜(19)*/ { stars: [[-0.04, 0.05],[0.04, 0.05],[0, -0.04]], lines: [[0,1],[0,2],[1,2]], bright: [0] },
  /* 参(20)*/ { stars: [[-0.08, 0.10],[0.08, 0.10],[-0.05, 0.02],[0, 0.02],[0.05, 0.02],[-0.08, -0.10],[0.08, -0.10]], lines: [[0,2],[1,4],[2,3],[3,4],[2,5],[4,6]], bright: [0, 1, 5, 6] },
  /* 井(21)*/ { stars: [[-0.10, 0.06],[-0.04, 0.10],[0.04, 0.10],[0.10, 0.06],[0.10, -0.06],[0.04, -0.10],[-0.04, -0.10],[-0.10, -0.06]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]], bright: [0, 3] },
  /* 鬼(22)*/ { stars: [[-0.08, 0.06],[0.08, 0.06],[0.08, -0.06],[-0.08, -0.06],[0, 0]], lines: [[0,4],[1,4],[2,4],[3,4]], bright: [4] },
  /* 柳(23)*/ { stars: [[-0.10, 0.04],[-0.08, 0.10],[-0.04, 0.13],[0.02, 0.12],[0.06, 0.08],[0.08, 0.02],[0.06, -0.04],[0.02, -0.08]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]], bright: [3] },
  /* 星(24)*/ { stars: [[0, 0.10],[0.07, 0.07],[0.10, 0],[0.07, -0.07],[0, -0.10],[-0.07, -0.07],[-0.10, 0]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0]], bright: [0, 2] },
  /* 张(25)*/ { stars: [[-0.06, 0.08],[0.06, 0.08],[0.10, 0],[0.06, -0.08],[-0.06, -0.08],[-0.10, 0]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]], bright: [0, 2] },
  /* 翼(26)*/ { stars: [[-0.12, 0.06],[-0.06, 0.12],[0, 0.14],[0.06, 0.12],[0.12, 0.06],[0.12, -0.02],[0.04, -0.08],[-0.04, -0.08],[-0.12, -0.02]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,0]], bright: [2] },
  /* 轸(27)*/ { stars: [[-0.06, 0.06],[0.06, 0.06],[0.08, -0.06],[-0.08, -0.06]], lines: [[0,1],[1,2],[2,3],[3,0]], bright: [0, 1] },
]

const BEIDOU_STARS: [number, number][] = [
  [-88, -20], [-60, -28], [-40, -54], [-62, -72], [-36, -84], [-10, -96], [14, -106],
]
const BEIDOU_LINES: [number, number][] = [
  [0,1],[1,2],[2,3],[3,0],
  [3,4],[4,5],[5,6],
]

const R_MID = 1.5

const SIXIANG = [
  { text: '青龙', deg: -51.43,  color: 'rgba(74,130,170,0.88)',  glow: 'rgba(74,130,170,0.45)' },
  { text: '玄武', deg:  38.57,  color: 'rgba(100,75,150,0.88)',  glow: 'rgba(100,75,150,0.45)' },
  { text: '白虎', deg: 128.57,  color: 'rgba(200,205,220,0.88)', glow: 'rgba(200,205,220,0.45)' },
  { text: '朱雀', deg: 218.57,  color: 'rgba(210,80,72,0.88)',   glow: 'rgba(210,80,72,0.45)'  },
]

const SIXIANG_BOUNDARIES = [-6.43, 83.57, 173.57, 263.57]

function createLabelTexture(highlightIdx?: number): THREE.CanvasTexture {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const toPx = (r: number) => r * 170
  const cx = size / 2
  const cy = size / 2

  ctx.save()
  ctx.strokeStyle = 'rgba(180,205,230,0.20)'
  ctx.lineWidth = 2
  SIXIANG_BOUNDARIES.forEach(deg => {
    const a = (deg * Math.PI) / 180
    ctx.beginPath()
    ctx.moveTo(cx + toPx(1.05) * Math.cos(a), cy + toPx(1.05) * Math.sin(a))
    ctx.lineTo(cx + toPx(1.96) * Math.cos(a), cy + toPx(1.96) * Math.sin(a))
    ctx.stroke()
  })
  ctx.restore()

  XIU_DATA.forEach((constl, i) => {
    const isHi = i === highlightIdx
    const a = ((i * (360 / 28) - 90) * Math.PI) / 180
    const cos_a = Math.cos(a)
    const sin_a = Math.sin(a)
    const cxm = cx + toPx(R_MID) * cos_a
    const cym = cy + toPx(R_MID) * sin_a

    const starPx = constl.stars.map(([dr, dt]) => ({
      x: cxm + toPx(dr) * cos_a - toPx(dt) * sin_a,
      y: cym + toPx(dr) * sin_a + toPx(dt) * cos_a,
    }))

    ctx.save()
    ctx.strokeStyle = isHi ? 'rgba(200,170,90,0.72)' : 'rgba(140,170,210,0.44)'
    ctx.lineWidth = isHi ? 2.5 : 2.0
    constl.lines.forEach(([from, to]) => {
      ctx.beginPath()
      ctx.moveTo(starPx[from].x, starPx[from].y)
      ctx.lineTo(starPx[to].x, starPx[to].y)
      ctx.stroke()
    })
    ctx.restore()

    starPx.forEach((pos, si) => {
      const isBright = constl.bright.includes(si)
      const radius = isHi ? (isBright ? 7 : 5) : (isBright ? 4.5 : 3)
      const color = isHi ? 'rgba(230,200,120,0.95)' : 'rgba(200,215,240,0.78)'
      const glowColor = isHi ? 'rgba(230,200,120,0.65)' : 'rgba(150,180,230,0.45)'

      ctx.save()
      ctx.shadowColor = glowColor
      ctx.shadowBlur = isHi ? (isBright ? 12 : 7) : 5
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  })

  const bdPx = BEIDOU_STARS.map(([dx, dy]) => ({ x: cx + dx, y: cy + dy }))

  ctx.save()
  ctx.strokeStyle = 'rgba(200,170,80,0.58)'
  ctx.lineWidth = 2.2
  BEIDOU_LINES.forEach(([from, to]) => {
    ctx.beginPath()
    ctx.moveTo(bdPx[from].x, bdPx[from].y)
    ctx.lineTo(bdPx[to].x, bdPx[to].y)
    ctx.stroke()
  })
  ctx.restore()

  bdPx.forEach((pos, i) => {
    const isVega = i === 4
    ctx.save()
    ctx.shadowColor = 'rgba(230,200,120,0.75)'
    ctx.shadowBlur = isVega ? 12 : 7
    ctx.fillStyle = 'rgba(225,200,115,0.90)'
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, isVega ? 6 : 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })

  ctx.save()
  ctx.font = '400 11px Arial, sans-serif'
  ctx.fillStyle = 'rgba(200,175,100,0.65)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('北斗', cx + (-60), cy + (-118))
  ctx.restore()

  const labelR = toPx(0.78)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  SIXIANG.forEach(({ text, deg, color, glow }) => {
    const a = (deg * Math.PI) / 180
    const lx = cx + labelR * Math.cos(a)
    const ly = cy + labelR * Math.sin(a)
    ctx.save()
    ctx.font = '600 15px "Noto Serif SC", STSong, "Songti SC", serif'
    ctx.fillStyle = color
    ctx.shadowColor = glow
    ctx.shadowBlur = 5
    ctx.fillText(text, lx, ly)
    ctx.restore()
  })

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

export function useLabelTexture(highlightIdx?: number): THREE.CanvasTexture {
  const tex = useMemo(() => createLabelTexture(highlightIdx), [highlightIdx])
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}
