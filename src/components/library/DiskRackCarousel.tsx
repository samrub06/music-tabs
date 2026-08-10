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
/** Pull slot centers closer so cards stack like a shelf. */
const SLOT_OVERLAP_CLASS = '-mx-9'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Horizontal song-cover rack for phone landscape.
 * Flat covers + snap scroll (no vinyl-fold / rotateY animation).
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
  const rafRef = useRef<number | null>(null)
  const activeIndexRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

  const applyMotions = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const scrollerRect = scroller.getBoundingClientRect()
    const centerX = scrollerRect.left + scrollerRect.width / 2

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

      visual.style.zIndex = String(Math.round(50 - abs * 14))
    }

    if (closestIndex !== activeIndexRef.current) {
      activeIndexRef.current = closestIndex
      setActiveIndex(closestIndex)
    }
  }, [items.length, isRtl])

  useEffect(() => {
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

    return () => {
      scroller.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
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
              'relative aspect-square h-[160px] w-full min-h-[160px] overflow-hidden rounded-lg bg-muted',
              'shadow-[0_14px_36px_-12px_rgba(0,0,0,0.55)]',
              'ring-1 ring-black/10 dark:ring-white/10'
            )
            const mediaClass = 'relative h-full w-full overflow-hidden rounded-lg'

            const coverInner = <div className={mediaClass}>{item.content}</div>

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
                  className="relative"
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
