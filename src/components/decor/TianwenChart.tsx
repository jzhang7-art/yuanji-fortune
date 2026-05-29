/**
 * 三环式天文圆盘 — 浑天仪倾斜俯视的真 3D 版本
 * 28 宿星座图案（星点+连线，观星 App 质感）绘制在 CanvasTexture 上
 * 内圈北斗七星；高亮当日宿用金色+glow；无文字标注
 * WebGL 失败 → 自动降级到 TianwenChartSvgFallback
 *
 * Texture 数据与生成逻辑见 ./useLabelTexture.ts
 */

import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from 'framer-motion'
import { TianwenChartSvgFallback } from './TianwenChartSvg'
import { useLabelTexture } from './useLabelTexture'

const R_OUTER = 1.9
const R_MID = 1.5
const R_INNER = 1.1
const R_CORE = 0.4

const COL_SHIQING = '#4a7396'
const COL_ZHUSHA_BRIGHT = '#d4524a'

function xiuHighlightPos(idx: number): { x: number; z: number } {
  const a = ((idx * (360 / 28) - 90) * Math.PI) / 180
  return { x: R_MID * Math.cos(a), z: R_MID * Math.sin(a) }
}

function PulseStar({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    const phase = (Math.sin((t * Math.PI * 2) / 2.4) + 1) / 2
    const s = 1 + phase * 2.2
    ref.current.scale.setScalar(s)
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.85 * (1 - phase)
  })
  return (
    <mesh ref={ref} position={[x, 0.006, z]} rotation-x={-Math.PI / 2}>
      <circleGeometry args={[0.04, 24]} />
      <meshBasicMaterial color={COL_ZHUSHA_BRIGHT} transparent opacity={0.85} />
    </mesh>
  )
}

function Ring({ inner, outer, intensity }: { inner: number; outer: number; intensity: number }) {
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <ringGeometry args={[inner, outer, 96]} />
      <meshStandardMaterial
        color={COL_SHIQING}
        emissive={COL_SHIQING}
        emissiveIntensity={intensity}
        metalness={0.7}
        roughness={0.4}
        side={THREE.DoubleSide}
        transparent
        opacity={0.95}
      />
    </mesh>
  )
}

function Scene({ highlightIdx, reduced, bareInner }: { highlightIdx?: number; reduced: boolean; bareInner?: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const labelTex = useLabelTexture(highlightIdx)
  const hiPos = useMemo(
    () => (highlightIdx !== undefined ? xiuHighlightPos(highlightIdx) : null),
    [highlightIdx]
  )

  useFrame((_, dt) => {
    if (reduced || !groupRef.current) return
    groupRef.current.rotation.y += dt * 0.017
  })

  return (
    <group ref={groupRef}>
      {/* 三环：外层 3 道金属架在 bareInner 模式隐藏，极星圈始终保留 */}
      {!bareInner && <Ring inner={R_OUTER - 0.014} outer={R_OUTER + 0.014} intensity={0.7} />}
      {!bareInner && <Ring inner={R_MID - 0.011} outer={R_MID + 0.011} intensity={0.55} />}
      {!bareInner && <Ring inner={R_INNER - 0.011} outer={R_INNER + 0.011} intensity={0.55} />}
      <Ring inner={R_CORE - 0.014} outer={R_CORE + 0.014} intensity={0.7} />

      {/* 星座 CanvasTexture 平面 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshBasicMaterial map={labelTex} transparent depthWrite={false} />
      </mesh>

      {/* 子午/卯酉线（bareInner 时隐藏） */}
      {!bareInner && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.0006, 0]}>
          <planeGeometry args={[0.006, R_OUTER * 2]} />
          <meshBasicMaterial color={COL_SHIQING} transparent opacity={0.22} />
        </mesh>
      )}
      {!bareInner && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.0006, 0]}>
          <planeGeometry args={[R_OUTER * 2, 0.006]} />
          <meshBasicMaterial color={COL_SHIQING} transparent opacity={0.22} />
        </mesh>
      )}

      {/* 当日宿高亮 pulse + 点光 */}
      {hiPos && !reduced && (
        <>
          <PulseStar x={hiPos.x} z={hiPos.z} />
          <pointLight
            position={[hiPos.x, 0.7, hiPos.z]}
            intensity={1.6}
            distance={2}
            color={COL_ZHUSHA_BRIGHT}
          />
        </>
      )}

      {/* 中心极星朱砂十字 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]}>
        <planeGeometry args={[0.18, 0.014]} />
        <meshBasicMaterial color={COL_ZHUSHA_BRIGHT} transparent opacity={0.75} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]}>
        <planeGeometry args={[0.014, 0.18]} />
        <meshBasicMaterial color={COL_ZHUSHA_BRIGHT} transparent opacity={0.75} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.036, 18]} />
        <meshBasicMaterial color={COL_ZHUSHA_BRIGHT} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}

export function TianwenChart({
  size = 380,
  highlightIdx,
  bareInner,
}: {
  size?: number
  xiuOpacity?: number
  ringOpacity?: number
  highlightIdx?: number
  bareInner?: boolean
}) {
  const reduced = useReducedMotion() ?? false
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <TianwenChartSvgFallback size={size} highlightIdx={highlightIdx} bareInner={bareInner} />
  }

  return (
    <div style={{ width: size, height: size }} aria-hidden>
      <Canvas
        camera={{ position: [0, 4.0, 1.5], fov: 40, near: 0.1, far: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        frameloop={reduced ? 'demand' : 'always'}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        onError={() => setFailed(true)}
      >
        <ambientLight intensity={0.70} />
        <directionalLight position={[2.5, 4, 3]} intensity={0.65} color="#e6c878" />
        <pointLight position={[-3, 2, -2]} intensity={0.45} color="#4a7396" />
        <Scene highlightIdx={highlightIdx} reduced={reduced} bareInner={bareInner} />
      </Canvas>
    </div>
  )
}
