/** Shared Web Audio helpers for the jam-lab easter egg. */

let sharedAudioCtx: AudioContext | null = null

export function getAudioCtx(): AudioContext | null {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return null
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx()
    }
    return sharedAudioCtx
  } catch {
    return null
  }
}

function withMaster(
  ctx: AudioContext,
  build: (dest: AudioNode, now: number) => void
) {
  void ctx.resume()
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.setValueAtTime(0.7, now)
  master.connect(ctx.destination)
  build(master, now)
}

export function playGuitar() {
  const ctx = getAudioCtx()
  if (!ctx) return
  const freqs = [98, 123.47, 146.83, 196, 246.94, 392]
  withMaster(ctx, (dest, now) => {
    freqs.forEach((freq, i) => {
      const start = now + i * 0.03
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      osc.type = 'sawtooth'
      osc.frequency.value = freq
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(1600, start)
      filter.frequency.exponentialRampToValueAtTime(500, start + 0.7)
      const peak = 0.28 / Math.sqrt(i + 1)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(dest)
      osc.start(start)
      osc.stop(start + 1)
    })
  })
}

export function playPiano() {
  const ctx = getAudioCtx()
  if (!ctx) return
  const freqs = [261.63, 329.63, 392.0, 523.25]
  withMaster(ctx, (dest, now) => {
    freqs.forEach((freq, i) => {
      const start = now + i * 0.04
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.2)
      osc.connect(gain)
      gain.connect(dest)
      osc.start(start)
      osc.stop(start + 1.3)
    })
  })
}

export function playBass() {
  const ctx = getAudioCtx()
  if (!ctx) return
  withMaster(ctx, (dest, now) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(55, now)
    osc.frequency.exponentialRampToValueAtTime(41, now + 0.35)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.55, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
    osc.connect(gain)
    gain.connect(dest)
    osc.start(now)
    osc.stop(now + 0.6)
  })
}

export function playDrums() {
  const ctx = getAudioCtx()
  if (!ctx) return
  withMaster(ctx, (dest, now) => {
    // Kick
    const kick = ctx.createOscillator()
    const kickGain = ctx.createGain()
    kick.type = 'sine'
    kick.frequency.setValueAtTime(140, now)
    kick.frequency.exponentialRampToValueAtTime(40, now + 0.12)
    kickGain.gain.setValueAtTime(0.7, now)
    kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
    kick.connect(kickGain)
    kickGain.connect(dest)
    kick.start(now)
    kick.stop(now + 0.28)

    // Snare-ish noise
    const dur = 0.12
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.value = 1200
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.35, now + 0.08)
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08 + dur)
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(dest)
    noise.start(now + 0.08)
    noise.stop(now + 0.08 + dur)
  })
}

export function playTrumpet() {
  const ctx = getAudioCtx()
  if (!ctx) return
  withMaster(ctx, (dest, now) => {
    ;[392, 493.88, 587.33].forEach((freq, i) => {
      const start = now + i * 0.08
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45)
      osc.connect(gain)
      gain.connect(dest)
      osc.start(start)
      osc.stop(start + 0.5)
    })
  })
}

export function playViolin() {
  const ctx = getAudioCtx()
  if (!ctx) return
  withMaster(ctx, (dest, now) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = 440
    lfo.frequency.value = 5.5
    lfoGain.gain.value = 4
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.2, now + 0.15)
    gain.gain.linearRampToValueAtTime(0.0001, now + 1.1)
    osc.connect(gain)
    gain.connect(dest)
    osc.start(now)
    lfo.start(now)
    osc.stop(now + 1.15)
    lfo.stop(now + 1.15)
  })
}

export function playSax() {
  const ctx = getAudioCtx()
  if (!ctx) return
  withMaster(ctx, (dest, now) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    osc.type = 'square'
    osc.frequency.value = 277.18
    filter.type = 'bandpass'
    filter.frequency.value = 700
    filter.Q.value = 4
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(dest)
    osc.start(now)
    osc.stop(now + 0.85)
  })
}

export function playFlute() {
  const ctx = getAudioCtx()
  if (!ctx) return
  withMaster(ctx, (dest, now) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 784
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7)
    osc.connect(gain)
    gain.connect(dest)
    osc.start(now)
    osc.stop(now + 0.75)
  })
}

export function playUkulele() {
  const ctx = getAudioCtx()
  if (!ctx) return
  const freqs = [392, 261.63, 329.63, 440]
  withMaster(ctx, (dest, now) => {
    freqs.forEach((freq, i) => {
      const start = now + i * 0.02
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55)
      osc.connect(gain)
      gain.connect(dest)
      osc.start(start)
      osc.stop(start + 0.6)
    })
  })
}

export function playSynth() {
  const ctx = getAudioCtx()
  if (!ctx) return
  withMaster(ctx, (dest, now) => {
    ;[220, 277.18, 329.63, 440].forEach((freq, i) => {
      const start = now + i * 0.06
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35)
      osc.connect(gain)
      gain.connect(dest)
      osc.start(start)
      osc.stop(start + 0.4)
    })
  })
}

export function playMarimba() {
  const ctx = getAudioCtx()
  if (!ctx) return
  withMaster(ctx, (dest, now) => {
    ;[523.25, 659.25, 783.99].forEach((freq, i) => {
      const start = now + i * 0.07
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55)
      osc.connect(gain)
      gain.connect(dest)
      osc.start(start)
      osc.stop(start + 0.6)
    })
  })
}

export function playBell() {
  const ctx = getAudioCtx()
  if (!ctx) return
  withMaster(ctx, (dest, now) => {
    ;[880, 1760, 2640].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const peak = 0.22 / (i + 1)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4)
      osc.connect(gain)
      gain.connect(dest)
      osc.start(now)
      osc.stop(now + 1.45)
    })
  })
}

export function playHarp() {
  const ctx = getAudioCtx()
  if (!ctx) return
  const freqs = [523.25, 587.33, 659.25, 698.46, 783.99, 880]
  withMaster(ctx, (dest, now) => {
    freqs.forEach((freq, i) => {
      const start = now + i * 0.05
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9)
      osc.connect(gain)
      gain.connect(dest)
      osc.start(start)
      osc.stop(start + 1)
    })
  })
}
