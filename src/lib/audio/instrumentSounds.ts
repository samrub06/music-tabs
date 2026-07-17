/** Sample-based instrument playback for jam-lab (and floating guitar). */

export type JamInstrumentId =
  | 'banjo'
  | 'bass-clarinet'
  | 'bassoon'
  | 'cello'
  | 'clarinet'
  | 'contrabassoon'
  | 'cor-anglais'
  | 'double-bass'
  | 'flute'
  | 'french-horn'
  | 'guitar'
  | 'mandolin'
  | 'oboe'
  | 'percussion'
  | 'saxophone'
  | 'trombone'
  | 'trumpet'
  | 'tuba'
  | 'viola'
  | 'violin'

/** Display names matching the Philharmonia sample folders. */
export const JAM_INSTRUMENTS: {
  id: JamInstrumentId
  name: string
  accent: string
}[] = [
  { id: 'banjo', name: 'Banjo', accent: '#E8A54B' },
  { id: 'bass-clarinet', name: 'Bass clarinet', accent: '#7A9BB8' },
  { id: 'bassoon', name: 'Bassoon', accent: '#C48A5A' },
  { id: 'cello', name: 'Cello', accent: '#D4785A' },
  { id: 'clarinet', name: 'Clarinet', accent: '#8BAFCF' },
  { id: 'contrabassoon', name: 'Contrabassoon', accent: '#A07850' },
  { id: 'cor-anglais', name: 'Cor anglais', accent: '#B8956A' },
  { id: 'double-bass', name: 'Double bass', accent: '#F0A060' },
  { id: 'flute', name: 'Flute', accent: '#7EB8D4' },
  { id: 'french-horn', name: 'French horn', accent: '#D4A574' },
  { id: 'guitar', name: 'Guitar', accent: '#E8A54B' },
  { id: 'mandolin', name: 'Mandolin', accent: '#C9B86A' },
  { id: 'oboe', name: 'Oboe', accent: '#C07060' },
  { id: 'percussion', name: 'Percussion', accent: '#F07178' },
  { id: 'saxophone', name: 'Saxophone', accent: '#D4956A' },
  { id: 'trombone', name: 'Trombone', accent: '#E0B060' },
  { id: 'trumpet', name: 'Trumpet', accent: '#F5D76E' },
  { id: 'tuba', name: 'Tuba', accent: '#8B7A5E' },
  { id: 'viola', name: 'Viola', accent: '#D08070' },
  { id: 'violin', name: 'Violin', accent: '#E07070' },
]

let sharedAudioCtx: AudioContext | null = null
const bufferCache = new Map<JamInstrumentId, AudioBuffer | 'loading' | 'failed'>()
const loadWaiters = new Map<
  JamInstrumentId,
  Array<(buf: AudioBuffer | null) => void>
>()

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

function sampleUrl(id: JamInstrumentId): string {
  return `/sounds/jam-lab/${id}.mp3`
}

async function loadBuffer(id: JamInstrumentId): Promise<AudioBuffer | null> {
  const cached = bufferCache.get(id)
  if (cached && cached !== 'loading' && cached !== 'failed') return cached
  if (cached === 'failed') return null

  if (cached === 'loading') {
    return new Promise((resolve) => {
      const waiters = loadWaiters.get(id) ?? []
      waiters.push(resolve)
      loadWaiters.set(id, waiters)
    })
  }

  const ctx = getAudioCtx()
  if (!ctx) return null

  bufferCache.set(id, 'loading')
  try {
    const res = await fetch(sampleUrl(id))
    if (!res.ok) throw new Error(`Failed to load ${id}: ${res.status}`)
    const arr = await res.arrayBuffer()
    const buf = await ctx.decodeAudioData(arr.slice(0))
    bufferCache.set(id, buf)
    const waiters = loadWaiters.get(id) ?? []
    loadWaiters.delete(id)
    waiters.forEach((w) => w(buf))
    return buf
  } catch (err) {
    console.error(err)
    bufferCache.set(id, 'failed')
    const waiters = loadWaiters.get(id) ?? []
    loadWaiters.delete(id)
    waiters.forEach((w) => w(null))
    return null
  }
}

/** Warm the AudioContext + decode all jam-lab samples in the background. */
export function preloadJamInstruments() {
  const ctx = getAudioCtx()
  if (!ctx) return
  void ctx.resume()
  for (const { id } of JAM_INSTRUMENTS) {
    void loadBuffer(id)
  }
}

/** Each call starts a new voice — previous notes keep playing (polyphonic). */
function playBuffer(ctx: AudioContext, buffer: AudioBuffer) {
  void ctx.resume()
  const now = ctx.currentTime
  const source = ctx.createBufferSource()
  source.buffer = buffer

  const playFor = Math.max(0.08, buffer.duration)
  const fadeIn = 0.012
  const fadeOut = Math.min(0.12, playFor * 0.15)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.85, now + fadeIn)
  gain.gain.setValueAtTime(0.85, now + Math.max(fadeIn, playFor - fadeOut))
  gain.gain.exponentialRampToValueAtTime(0.0001, now + playFor)

  source.connect(gain)
  gain.connect(ctx.destination)
  source.start(now)
  source.stop(now + playFor + 0.02)
}

export function playInstrument(id: JamInstrumentId) {
  const ctx = getAudioCtx()
  if (!ctx) return

  const cached = bufferCache.get(id)
  if (cached && cached !== 'loading' && cached !== 'failed') {
    playBuffer(ctx, cached)
    return
  }

  void loadBuffer(id).then((buf) => {
    if (buf) playBuffer(ctx, buf)
  })
}

/** Kept for FloatingGuitar easter egg. */
export function playGuitar() {
  playInstrument('guitar')
}
