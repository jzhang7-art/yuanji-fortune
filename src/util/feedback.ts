// 拨号轮 tick 反馈:短震 + Web Audio 合成的齿轮 click。
// - 震动:仅 Android/部分平台支持(iOS Safari 多数版本忽略 navigator.vibrate)
// - 音频:首次 user gesture 后才能 resume() 成功,LotusOnboarding 的 pointer 事件即 user gesture
// - 40ms 节流防快速拨动时连发刺耳
// - prefers-reduced-motion 用户全静默

let audioCtx: AudioContext | null = null
let lastTickAt = 0

function ensureContext(): AudioContext | null {
  if (audioCtx) return audioCtx
  const AC =
    (typeof window !== 'undefined' && (window.AudioContext || (window as unknown as {
      webkitAudioContext?: typeof AudioContext
    }).webkitAudioContext)) || null
  if (!AC) return null
  try {
    audioCtx = new AC()
    return audioCtx
  } catch {
    return null
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** 拨号轮单次 tick 反馈。在 onChange 调用即可。 */
export function tickFeedback(): void {
  if (prefersReducedMotion()) return
  const now = Date.now()
  if (now - lastTickAt < 40) return
  lastTickAt = now

  // 震动 (Android Chrome 支持; iOS Safari 多数版本静默忽略,无害)
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(8)
    } catch {
      /* 部分平台权限拒绝,忽略 */
    }
  }

  // 音频齿轮 click:1.8kHz → 900Hz 极短下行,模拟金属脱齿的瞬间共振
  const ctx = ensureContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  try {
    const t = ctx.currentTime
    // 模仿 iOS UIPickerView "tock":短噪声经低频带通滤波 → 木质共振脉冲
    const dur = 0.05
    const sampleRate = ctx.sampleRate
    const bufferSize = Math.max(1, Math.floor(sampleRate * dur))
    const noiseBuf = ctx.createBuffer(1, bufferSize, sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      // 微调:前 4ms 全幅噪声(attack),其后线性衰减,模拟敲击瞬间能量
      const attackSamples = Math.floor(sampleRate * 0.004)
      const env = i < attackSamples ? 1 : Math.max(0, 1 - (i - attackSamples) / (bufferSize - attackSamples))
      data[i] = (Math.random() * 2 - 1) * env
    }

    const source = ctx.createBufferSource()
    source.buffer = noiseBuf

    // 主共振:280Hz 带通模拟木质腔体
    const filterLow = ctx.createBiquadFilter()
    filterLow.type = 'bandpass'
    filterLow.frequency.value = 280
    filterLow.Q.value = 9

    // 副脉冲:1.6kHz 带通点缀,加一点"触感"高光
    const filterHigh = ctx.createBiquadFilter()
    filterHigh.type = 'bandpass'
    filterHigh.frequency.value = 1600
    filterHigh.Q.value = 6

    const gainLow = ctx.createGain()
    gainLow.gain.setValueAtTime(0.0001, t)
    gainLow.gain.exponentialRampToValueAtTime(0.32, t + 0.001)
    gainLow.gain.exponentialRampToValueAtTime(0.001, t + 0.045)

    const gainHigh = ctx.createGain()
    gainHigh.gain.setValueAtTime(0.0001, t)
    gainHigh.gain.exponentialRampToValueAtTime(0.06, t + 0.0008)
    gainHigh.gain.exponentialRampToValueAtTime(0.001, t + 0.018)

    source.connect(filterLow)
    filterLow.connect(gainLow)
    gainLow.connect(ctx.destination)

    source.connect(filterHigh)
    filterHigh.connect(gainHigh)
    gainHigh.connect(ctx.destination)

    source.start(t)
    source.stop(t + dur + 0.01)
  } catch {
    /* 浏览器拒绝音频,静默 */
  }
}
