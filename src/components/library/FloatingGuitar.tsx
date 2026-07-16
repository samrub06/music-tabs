'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { playGuitar } from '@/lib/audio/instrumentSounds'

type NoteParticle = {
  id: number
  char: string
  dx: number
  dy: number
  delayMs: number
  sizePx: number
  spinDeg: number
  colorClass: string
  durationMs: number
}

const NOTE_CHARS = ['♪', '♫', '♩', '♬', '♮', '𝄞', '♭', '♯'] as const
const NOTE_COLORS = [
  'text-amber-500 dark:text-amber-300',
  'text-primary',
  'text-orange-500 dark:text-orange-300',
  'text-rose-500 dark:text-rose-300',
  'text-yellow-500 dark:text-yellow-300',
  'text-red-500 dark:text-red-400',
  'text-amber-600 dark:text-amber-200',
] as const

const SIZE = 64
const DRAG_THRESHOLD_PX = 8
const STORAGE_KEY = 'explorer-floating-guitar-pos'
const TAP_COUNT_KEY = 'explorer-floating-guitar-taps'
/** After this many taps, open the instrument jam lab */
const JAM_LAB_TAP_THRESHOLD = 8
const MAX_NOTE_COUNT = 48

type Position = { x: number; y: number }

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function defaultPosition(): Position {
  if (typeof window === 'undefined') return { x: 24, y: 24 }
  const bottomNav = window.innerWidth < 1024 ? 96 : 32
  return {
    x: Math.max(12, window.innerWidth - SIZE - 20),
    y: Math.max(12, window.innerHeight - SIZE - bottomNav),
  }
}

function clampPosition(pos: Position): Position {
  const maxX = Math.max(8, window.innerWidth - SIZE - 8)
  const maxY = Math.max(8, window.innerHeight - SIZE - 8)
  return {
    x: Math.min(Math.max(8, pos.x), maxX),
    y: Math.min(Math.max(8, pos.y), maxY),
  }
}

function loadPosition(): Position {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPosition()
    const parsed = JSON.parse(raw) as Position
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') {
      return defaultPosition()
    }
    return clampPosition(parsed)
  } catch {
    return defaultPosition()
  }
}

function savePosition(pos: Position) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
  } catch {
    // ignore quota / private mode
  }
}

function loadTapCount(): number {
  try {
    const raw = sessionStorage.getItem(TAP_COUNT_KEY)
    const n = raw ? Number.parseInt(raw, 10) : 0
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

function saveTapCount(count: number) {
  try {
    sessionStorage.setItem(TAP_COUNT_KEY, String(count))
  } catch {
    // ignore
  }
}

/** Tap 1 → 1 note, then 2, 4, 7, 11, 16… */
function noteCountForTap(tapNumber: number, reduceMotion: boolean): number {
  const n = Math.max(1, tapNumber)
  const count = 1 + (n * (n - 1)) / 2
  const capped = Math.min(MAX_NOTE_COUNT, Math.round(count))
  return reduceMotion ? Math.min(10, capped) : capped
}

function spawnExplosion(count: number): NoteParticle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45
    const distance = 90 + Math.random() * (140 + Math.min(count, 40) * 2)
    return {
      id: 0,
      char: NOTE_CHARS[i % NOTE_CHARS.length],
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      delayMs: Math.floor(Math.random() * 120),
      sizePx: 18 + Math.floor(Math.random() * 22),
      spinDeg: (Math.random() - 0.5) * 320,
      colorClass: NOTE_COLORS[i % NOTE_COLORS.length],
      durationMs: 900 + Math.floor(Math.random() * 500),
    }
  })
}

function GuitarSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <ellipse cx="26" cy="40" rx="16" ry="18" className="fill-amber-700 dark:fill-amber-600" />
      <ellipse cx="26" cy="40" rx="12" ry="14" className="fill-amber-800/40 dark:fill-amber-900/50" />
      <circle cx="26" cy="40" r="5.5" className="fill-amber-950 dark:fill-amber-950" />
      <circle cx="26" cy="40" r="3.5" className="fill-amber-900/80" />
      <rect x="21" y="48" width="10" height="2.5" rx="1" className="fill-amber-950/80" />
      <rect
        x="40"
        y="20"
        width="5"
        height="22"
        rx="1.5"
        transform="rotate(-35 40 20)"
        className="fill-amber-900 dark:fill-amber-800"
      />
      <path
        d="M50.5 8.5c1.2-1.8 4.2-2.2 5.8-.4 1.2 1.4.8 3.4-.6 4.4l-4.2 3.1-3.2-4.4 2.2-2.7z"
        className="fill-amber-900 dark:fill-amber-800"
      />
      <circle cx="52.2" cy="9.2" r="1.2" className="fill-amber-200 dark:fill-amber-300" />
      <circle cx="54.8" cy="11.4" r="1.2" className="fill-amber-200 dark:fill-amber-300" />
      <path
        d="M28 36.5 L49 14.5 M27 40 L50 16.5 M26 43.5 L50.5 18.5"
        className="stroke-amber-100/50 dark:stroke-amber-200/40"
        strokeWidth="0.6"
        strokeLinecap="round"
      />
      <ellipse
        cx="21"
        cy="33"
        rx="4"
        ry="6"
        className="fill-white/20 dark:fill-white/10"
        transform="rotate(-20 21 33)"
      />
    </svg>
  )
}

interface FloatingGuitarProps {
  className?: string
}

export function FloatingGuitar({ className }: FloatingGuitarProps) {
  const router = useRouter()
  const [pos, setPos] = useState<Position>({ x: 24, y: 24 })
  const [mounted, setMounted] = useState(false)
  const [notes, setNotes] = useState<NoteParticle[]>([])
  const [strumming, setStrumming] = useState(false)
  const [shockwave, setShockwave] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [warping, setWarping] = useState(false)

  const noteIdRef = useRef(0)
  const tapCountRef = useRef(0)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  } | null>(null)
  const posRef = useRef(pos)
  posRef.current = pos

  useEffect(() => {
    setPos(loadPosition())
    tapCountRef.current = loadTapCount()
    setMounted(true)
    setReduceMotion(prefersReducedMotion())
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduceMotion(mq.matches)
    mq.addEventListener('change', onChange)

    const onResize = () => setPos((p) => clampPosition(p))
    window.addEventListener('resize', onResize)

    return () => {
      mq.removeEventListener('change', onChange)
      window.removeEventListener('resize', onResize)
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current)
    }
  }, [])

  const explode = useCallback(() => {
    if (warping) return

    const nextTap = tapCountRef.current + 1
    tapCountRef.current = nextTap
    saveTapCount(nextTap)

    playGuitar()
    setStrumming(true)
    setShockwave(true)
    window.setTimeout(() => setStrumming(false), 480)
    window.setTimeout(() => setShockwave(false), 700)

    const count = noteCountForTap(nextTap, reduceMotion)
    const burst = spawnExplosion(count).map((n) => ({
      ...n,
      id: ++noteIdRef.current,
    }))
    setNotes(burst)

    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    clearTimerRef.current = setTimeout(
      () => setNotes([]),
      reduceMotion ? 900 : 1500
    )

    if (nextTap >= JAM_LAB_TAP_THRESHOLD) {
      setWarping(true)
      saveTapCount(0)
      tapCountRef.current = 0
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current)
      navigateTimerRef.current = setTimeout(() => {
        router.push('/jam-lab')
      }, reduceMotion ? 400 : 900)
    }
  }, [reduceMotion, router, warping])

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || warping) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: posRef.current.x,
      originY: posRef.current.y,
      moved: false,
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return

    drag.moved = true
    setDragging(true)
    setPos(clampPosition({ x: drag.originX + dx, y: drag.originY + dy }))
  }

  const endPointer = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // already released
    }

    const wasDrag = drag.moved
    dragRef.current = null
    setDragging(false)

    if (wasDrag) {
      savePosition(posRef.current)
      return
    }
    explode()
  }

  if (!mounted) return null

  return (
    <div
      className={cn('pointer-events-none fixed z-40', className)}
      style={{ left: pos.x, top: pos.y, width: SIZE, height: SIZE }}
    >
      <div className="relative flex h-full w-full items-center justify-center">
        {shockwave && (
          <span
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-amber-500/60 animate-explorer-shockwave"
            aria-hidden
          />
        )}

        {notes.map((note) => (
          <span
            key={note.id}
            className={cn(
              'pointer-events-none absolute select-none font-serif font-bold leading-none drop-shadow-md',
              'animate-explorer-note',
              note.colorClass
            )}
            style={
              {
                '--note-dx': `${note.dx}px`,
                '--note-dy': `${note.dy}px`,
                '--note-spin': `${note.spinDeg}deg`,
                fontSize: note.sizePx,
                animationDelay: `${note.delayMs}ms`,
                animationDuration: `${note.durationMs}ms`,
              } as CSSProperties
            }
            aria-hidden
          >
            {note.char}
          </span>
        ))}

        <button
          type="button"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          disabled={warping}
          className={cn(
            'pointer-events-auto relative flex h-14 w-14 touch-none items-center justify-center rounded-full',
            'cursor-grab border border-amber-700/25 bg-background/85 shadow-xl backdrop-blur-md',
            'dark:border-amber-400/20 dark:bg-background/75',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40',
            dragging && 'cursor-grabbing scale-110 shadow-2xl',
            warping && 'scale-125 opacity-40',
            !reduceMotion && !strumming && !dragging && !warping && 'animate-explorer-guitar-float',
            strumming && 'animate-explorer-guitar-strum'
          )}
          aria-label="Drag the guitar, or tap to explode notes"
          title="Drag me · tap to play"
        >
          <GuitarSvg className="h-9 w-9 pointer-events-none" />
        </button>
      </div>
    </div>
  )
}
