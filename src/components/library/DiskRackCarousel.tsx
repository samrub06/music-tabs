'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

export interface DiskRackItem {
  id: string
  /** Prefer onSelect for in-app song navigation; href for plain links. */
  href?: string
  onSelect?: () => void
  content: ReactNode
  title: ReactNode
  subtitle?: ReactNode
}

interface DiskRackCarouselProps {
  items: DiskRackItem[]
  className?: string
  /** Replaces the default centered title strip (e.g. playlist landscape dock). */
  renderFooter?: (active: DiskRackItem | undefined) => ReactNode
}

/** Visual card size (w-40 / 10rem = 160px). */
const CARD_SIZE_PX = 160
/** Strong book-edge angle once a neighbor is fully folded. */
const EDGE_ROTATE_DEG = 70
/**
 * Reach full fold by this fraction of a card-width from center.
 * With tight rack overlap (~0.5 card centers), neighbors still hit ~60°+.
 */
const FOLD_FULL_AT = 0.5
/** Pull slot centers closer so cards stack like a shelf. */
const SLOT_OVERLAP_CLASS = '-mx-9'
const PERSPECTIVE_PX = 900

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function signedUnit(value: number): number {
  if (value > 0) return 1
  if (value < 0) return -1
  return 0
}

/**
 * Cover-flow / vinyl-rack: selected card face-on, neighbors on their edge
 * like albums or floppy disks on a library shelf.
 *
 * Layout slots stay untransformed (stable scroll math); visuals get the 3D fold.
 * Active title sits at the bottom; the rack fills and centers vertically.
 */
export function DiskRackCarousel({
  items,
  className,
  renderFooter,
}: DiskRackCarouselProps) {
  const { isRtl } = useLanguage()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const slotRefs = useRef<(HTMLDivElement | null)[]>([])
  const visualRefs = useRef<(HTMLDivElement | null)[]>([])
  const spineRefs = useRef<(HTMLSpanElement | null)[]>([])
  const thicknessRefs = useRef<(HTMLSpanElement | null)[]>([])
  const rafRef = useRef<number | null>(null)
  const reducedRef = useRef(false)
  const activeIndexRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

  const applyMotions = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const scrollerRect = scroller.getBoundingClientRect()
    const centerX = scrollerRect.left + scrollerRect.width / 2
    const reduced = reducedRef.current

    let closestIndex = 0
    let closestAbs = Number.POSITIVE_INFINITY

    for (let i = 0; i < items.length; i++) {
      const slot = slotRefs.current[i]
      const visual = visualRefs.current[i]
      if (!slot || !visual) continue

      const slotRect = slot.getBoundingClientRect()
      const cardCenterX = slotRect.left + slotRect.width / 2
      let offset = (cardCenterX - centerX) / CARD_SIZE_PX
      if (isRtl) offset = -offset

      const abs = Math.abs(offset)
      if (abs < closestAbs) {
        closestAbs = abs
        closestIndex = i
      }

      if (reduced) {
        visual.style.transform = ''
        visual.style.opacity = '1'
        visual.style.zIndex = '1'
        visual.style.filter = ''
        const spine = spineRefs.current[i]
        const thickness = thicknessRefs.current[i]
        if (spine) spine.style.opacity = '0'
        if (thickness) thickness.style.opacity = '0'
        continue
      }

      const sign = signedUnit(offset)
      // Saturate quickly: at ±FOLD_FULL_AT card-widths → full EDGE_ROTATE_DEG
      const fold = clamp(abs / FOLD_FULL_AT, 0, 1)
      const rotateY = -sign * EDGE_ROTATE_DEG * fold
      // Pull folded cards toward the optical center so edges stack
      const translateX = -sign * fold * 18
      const translateZ = (1 - fold) * 64 - fold * 8
      const scale = clamp(1 - fold * 0.06, 0.88, 1)
      const opacity = clamp(1 - fold * 0.22, 0.55, 1)
      const zIndex = Math.round(50 - abs * 14)

      // perspective() on the visual itself — overflow:auto ancestors flatten parent perspective
      visual.style.transform = `perspective(${PERSPECTIVE_PX}px) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`
      visual.style.opacity = String(opacity)
      visual.style.zIndex = String(zIndex)
      visual.style.filter = fold > 0.35 ? `brightness(${1 - fold * 0.12})` : ''

      const spine = spineRefs.current[i]
      if (spine) {
        const showSpine = fold > 0.28
        spine.style.opacity = showSpine ? String(clamp(fold * 1.2, 0, 1)) : '0'
        if (rotateY > 0) {
          // Left cards fold → spine on the right (inner edge toward center)
          spine.style.left = 'auto'
          spine.style.right = '0'
          spine.style.backgroundImage =
            'linear-gradient(to left, rgba(0,0,0,0.72), rgba(0,0,0,0.28) 45%, transparent)'
        } else if (rotateY < 0) {
          spine.style.right = 'auto'
          spine.style.left = '0'
          spine.style.backgroundImage =
            'linear-gradient(to right, rgba(0,0,0,0.72), rgba(0,0,0,0.28) 45%, transparent)'
        }
      }

      const thickness = thicknessRefs.current[i]
      if (thickness) {
        const showEdge = fold > 0.28
        thickness.style.opacity = showEdge ? String(clamp(fold, 0, 0.95)) : '0'
        if (rotateY > 0) {
          thickness.style.left = 'auto'
          thickness.style.right = '-3px'
          thickness.style.boxShadow = '2px 0 0 rgba(0,0,0,0.35), 4px 0 8px rgba(0,0,0,0.2)'
        } else if (rotateY < 0) {
          thickness.style.right = 'auto'
          thickness.style.left = '-3px'
          thickness.style.boxShadow = '-2px 0 0 rgba(0,0,0,0.35), -4px 0 8px rgba(0,0,0,0.2)'
        }
      }
    }

    if (closestIndex !== activeIndexRef.current) {
      activeIndexRef.current = closestIndex
      setActiveIndex(closestIndex)
    }
  }, [items.length, isRtl])

  useEffect(() => {
    reducedRef.current = prefersReducedMotion()
    const scroller = scrollerRef.current
    if (!scroller) return

    const schedule = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        applyMotions()
      })
    }

    schedule()
    scroller.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotionPref = () => {
      reducedRef.current = mq.matches
      schedule()
    }
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onMotionPref)
    } else {
      mq.addListener(onMotionPref)
    }

    return () => {
      scroller.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', onMotionPref)
      } else {
        mq.removeListener(onMotionPref)
      }
    }
  }, [applyMotions, items.length])

  if (items.length === 0) return null

  const active = items[clamp(activeIndex, 0, items.length - 1)]

  return (
    <div
      className={cn(
        'relative flex h-full min-h-0 w-full flex-1 flex-col bg-transparent',
        className
      )}
    >
      {/* z-20 + pb/-mb: shadow stays visible over the dock (overflow-x-clip also clips Y) */}
      <div className="pointer-events-none relative z-20 -mb-8 flex min-h-0 flex-1 flex-col justify-center overflow-x-clip bg-transparent pb-8">
        <div
          ref={scrollerRef}
          className="pointer-events-auto flex h-full min-h-0 w-full snap-x snap-mandatory items-center overflow-x-auto overflow-y-visible bg-transparent scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingInline: 'calc(50% - 5rem)',
            gap: 0,
          }}
        >
          {items.map((item, index) => {
            const coverClass = cn(
              'relative aspect-square h-[160px] w-full min-h-[160px] overflow-visible rounded-lg bg-muted',
              'shadow-[0_14px_36px_-12px_rgba(0,0,0,0.55)]',
              'ring-1 ring-black/10 dark:ring-white/10'
            )
            const mediaClass =
              'relative h-full w-full overflow-hidden rounded-lg [transform-style:preserve-3d]'

            const spine = (
              <span
                ref={(node) => {
                  spineRefs.current[index] = node
                }}
                aria-hidden
                className="pointer-events-none absolute inset-y-0 z-10 w-2.5 opacity-0"
              />
            )

            const thickness = (
              <span
                ref={(node) => {
                  thicknessRefs.current[index] = node
                }}
                aria-hidden
                className="pointer-events-none absolute inset-y-1 z-0 w-1 rounded-sm bg-neutral-800/80 opacity-0 dark:bg-neutral-950"
              />
            )

            const coverInner = (
              <>
                {thickness}
                <div className={mediaClass}>
                  {item.content}
                  {spine}
                </div>
              </>
            )

            return (
              <div
                key={item.id}
                ref={(node) => {
                  slotRefs.current[index] = node
                }}
                className={cn(
                  'w-40 flex-shrink-0 snap-center px-0',
                  SLOT_OVERLAP_CLASS
                )}
              >
                <div
                  ref={(node) => {
                    visualRefs.current[index] = node
                  }}
                  className="relative will-change-transform [transform-style:preserve-3d]"
                >
                  {item.onSelect ? (
                    <button
                      type="button"
                      onClick={item.onSelect}
                      className={cn(coverClass, 'cursor-pointer text-left')}
                    >
                      {coverInner}
                    </button>
                  ) : item.href ? (
                    <Link href={item.href} className={coverClass}>
                      {coverInner}
                    </Link>
                  ) : (
                    <div className={coverClass}>{coverInner}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {renderFooter ? (
        renderFooter(active)
      ) : (
        <div className="relative z-10 shrink-0 bg-transparent px-4 pb-1 pt-2 text-center">
          <p className="truncate text-lg font-semibold leading-tight tracking-tight text-foreground sm:text-xl">
            {active?.title}
          </p>
          {active?.subtitle ? (
            <p className="mt-0.5 truncate text-sm leading-snug text-muted-foreground">
              {active.subtitle}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
