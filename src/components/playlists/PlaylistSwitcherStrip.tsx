'use client'

import { useEffect, useRef } from 'react'
import { FolderCover } from '@/components/presentational/FolderCover'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

export type PlaylistStripItem = {
  id: string
  name: string
  imageUrl?: string
  songCount: number
}

interface PlaylistSwitcherStripProps {
  playlists: PlaylistStripItem[]
  activePlaylistId: string
  className?: string
  /** Compact sizing for landscape / tight headers */
  compact?: boolean
  /**
   * Soft switch: parent loads songs without a full page navigation.
   * Required so the strip stays mounted while only the song list updates.
   */
  onSelectPlaylist: (id: string) => void
}

/** Horizontal playlist covers — tap to switch without leaving the detail page. */
export function PlaylistSwitcherStrip({
  playlists,
  activePlaylistId,
  className,
  compact = false,
  onSelectPlaylist,
}: PlaylistSwitcherStripProps) {
  const { t } = useLanguage()
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [activePlaylistId])

  if (playlists.length < 2) return null

  const handleSelect = (id: string) => {
    if (id === activePlaylistId) return
    onSelectPlaylist(id)
  }

  return (
    <div
      className={cn('shrink-0', className)}
      role="navigation"
      aria-label={t('folders.switchPlaylist')}
    >
      <div
        className={cn(
          'flex overflow-x-auto overscroll-x-contain scrollbar-hide touch-pan-x snap-x snap-mandatory',
          compact ? 'gap-2 pb-1' : 'gap-2.5 pb-1.5'
        )}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {playlists.map((playlist) => {
          const active = playlist.id === activePlaylistId
          return (
            <button
              key={playlist.id}
              ref={active ? activeRef : undefined}
              type="button"
              onClick={() => handleSelect(playlist.id)}
              aria-current={active ? 'true' : undefined}
              aria-label={playlist.name}
              title={playlist.name}
              className={cn(
                'flex shrink-0 snap-center flex-col items-center gap-1 rounded-xl transition-all duration-200',
                compact ? 'w-[3.75rem] p-0.5' : 'w-[4.5rem] p-1 sm:w-20',
                active
                  ? 'bg-primary/10 ring-2 ring-primary/40'
                  : 'hover:bg-muted/60'
              )}
            >
              <div
                className={cn(
                  'overflow-hidden rounded-lg',
                  compact ? 'h-11 w-11' : 'h-14 w-14 sm:h-16 sm:w-16'
                )}
              >
                <FolderCover
                  imageUrl={playlist.imageUrl}
                  name={playlist.name}
                  songCount={playlist.songCount}
                  className="h-full w-full rounded-lg"
                  shapeClassName="h-full w-full"
                />
              </div>
              <span
                className={cn(
                  'line-clamp-2 w-full text-center font-medium leading-tight text-foreground',
                  compact ? 'text-[9px]' : 'text-[10px] sm:text-xs'
                )}
              >
                {playlist.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
