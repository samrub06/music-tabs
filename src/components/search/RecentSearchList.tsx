'use client'

import { getRecentSearchDisplay, type RecentSearchItem } from '@/lib/recentSearches'

interface RecentSearchListProps {
  items: RecentSearchItem[]
  onItemClick: (item: RecentSearchItem) => void
  compact?: boolean
}

export function RecentSearchList({ items, onItemClick, compact = false }: RecentSearchListProps) {
  if (items.length === 0) return null

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      {items.map((item, index) => {
        const { imageUrl, title, subtitle } = getRecentSearchDisplay(item)

        return (
          <button
            key={`${item.query}-${index}`}
            type="button"
            onClick={() => onItemClick(item)}
            className={
              compact
                ? 'w-full flex items-center gap-2 py-1.5 px-2 rounded-lg bg-card border border-border/60 hover:border-border hover:bg-muted/30 transition-all text-start'
                : 'w-full flex items-center gap-3 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-card border border-border/80 hover:border-border hover:bg-muted/30 transition-all text-start'
            }
          >
            <div
              className={
                compact
                  ? 'flex-shrink-0 w-8 h-8 rounded-md overflow-hidden bg-muted'
                  : 'flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden bg-muted'
              }
            >
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={
                  compact
                    ? 'text-xs font-medium text-foreground truncate'
                    : 'text-sm font-semibold text-foreground truncate'
                }
                title={title}
              >
                {title}
              </p>
              {subtitle && (
                <p
                  className={
                    compact
                      ? 'text-[11px] text-muted-foreground truncate'
                      : 'text-xs text-muted-foreground truncate mt-0.5'
                  }
                  title={subtitle}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
