'use client'

import { useRouter, usePathname } from 'next/navigation'
import type { Song } from '@/types'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { UI_TEXT_ALIGN } from '@/utils/rtl'
import { useSongCover } from '@/lib/hooks/useSongCover'
import { SongCoverPlaceholder } from '@/components/presentational/SongCoverPlaceholder'
import { useIsMobile } from '@/hooks/use-mobile'
import { useLandscapeMobile } from '@/lib/hooks/useLandscapeMobile'
import { DiskRackCarousel, type DiskRackItem } from '@/components/library/DiskRackCarousel'
import { useMemo, useCallback } from 'react'

interface SongGalleryProps {
  songs: Song[]
  showAddButton?: boolean
  onAddClick?: (song: Song) => void
  addingId?: string | null
  hasUser?: boolean
  variant?: 'default' | 'compact' | 'folder'
  /**
   * When true, phone landscape swaps the grid for a vinyl-rack cover-flow.
   * Use on songs / playlist pages — not explorer.
   */
  diskRackOnLandscape?: boolean
  /** Optional custom navigation (e.g. public playlist context). */
  onSongSelect?: (song: Song) => void
  className?: string
}

const gridVariantClasses = {
  default:
    'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  compact:
    'grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7',
  folder:
    'grid grid-cols-5 gap-2 sm:grid-cols-5 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7',
} as const

function storeSongNavigation(songs: Song[], song: Song, pathname: string | null) {
  if (typeof window === 'undefined') return
  const songList = songs.map((s) => s.id)
  const currentIndex = songs.findIndex((s) => s.id === song.id)
  sessionStorage.setItem(
    'songNavigation',
    JSON.stringify({
      songList,
      currentIndex: currentIndex >= 0 ? currentIndex : 0,
      sourceUrl: pathname || window.location.pathname,
    })
  )
  sessionStorage.removeItem('hasUsedNext')
}

function SongDiskCover({ song }: { song: Song }) {
  const coverUrl = useSongCover(song)
  if (coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverUrl}
        alt={song.title}
        className="h-full w-full object-cover pointer-events-none"
        draggable={false}
      />
    )
  }
  return <SongCoverPlaceholder iconClassName="min-h-7 min-w-7 max-h-11 max-w-11" />
}

function buildDiskRackItems(
  songs: Song[],
  onSelect: (song: Song) => void
): DiskRackItem[] {
  return songs.map((song) => ({
    id: song.id,
    onSelect: () => onSelect(song),
    content: <SongDiskCover song={song} />,
    title: song.title,
    subtitle: song.author || undefined,
  }))
}

// Draggable song card component
function DraggableSongCard({
  song,
  songs,
  pathname,
  router,
  hasUser,
  variant = 'default',
  onSongSelect,
}: {
  song: Song
  songs: Song[]
  pathname: string | null
  router: ReturnType<typeof useRouter>
  hasUser?: boolean
  variant?: 'default' | 'compact' | 'folder'
  onSongSelect?: (song: Song) => void
}) {
  const isMobile = useIsMobile()
  // Drag-to-folder is desktop-only; on phone it fights scrolling and accidental moves.
  const canDrag = Boolean(hasUser) && !isMobile

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: song.id,
    disabled: !canDrag,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const handleSongClick = () => {
    if (isDragging) return
    if (onSongSelect) {
      onSongSelect(song)
      return
    }
    storeSongNavigation(songs, song, pathname)
    router.push(`/song/${song.id}`)
  }

  const isCompact = variant === 'compact' || variant === 'folder'
  const coverUrl = useSongCover(song)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex flex-col',
        isCompact ? 'gap-1' : 'gap-2',
        isDragging && 'z-50 opacity-75'
      )}
    >
      <div
        onClick={handleSongClick}
        className={cn(
          'relative aspect-square w-full cursor-pointer overflow-hidden bg-muted',
          isCompact ? 'rounded-lg' : 'rounded-xl',
          canDrag && 'active:cursor-grabbing'
        )}
        {...(canDrag ? { ...listeners, ...attributes } : {})}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={song.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105 pointer-events-none"
            draggable={false}
          />
        ) : (
          <SongCoverPlaceholder
            iconClassName={isCompact ? 'min-h-7 min-w-7 max-h-11 max-w-11' : undefined}
          />
        )}
      </div>

      <div
        onClick={handleSongClick}
        className={cn('min-w-0 cursor-pointer', isCompact ? 'space-y-0' : 'space-y-0.5', UI_TEXT_ALIGN)}
      >
        <h3
          className={cn(
            'truncate font-medium text-foreground transition-colors group-hover:text-primary',
            isCompact ? 'text-xs' : 'text-sm'
          )}
        >
          {song.title}
        </h3>
        <p className={cn('truncate text-muted-foreground', isCompact ? 'text-[10px]' : 'text-xs')}>
          {song.author}
        </p>
      </div>
    </div>
  )
}

export default function SongGallery({
  songs,
  hasUser = false,
  variant = 'default',
  diskRackOnLandscape = false,
  onSongSelect,
  className,
}: SongGalleryProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isLandscapeMobile = useLandscapeMobile()

  const handleSelect = useCallback(
    (song: Song) => {
      if (onSongSelect) {
        onSongSelect(song)
        return
      }
      storeSongNavigation(songs, song, pathname)
      router.push(`/song/${song.id}`)
    },
    [onSongSelect, songs, pathname, router]
  )

  const diskItems = useMemo(
    () =>
      diskRackOnLandscape && isLandscapeMobile
        ? buildDiskRackItems(songs, handleSelect)
        : [],
    [songs, diskRackOnLandscape, isLandscapeMobile, handleSelect]
  )

  if (diskRackOnLandscape && isLandscapeMobile) {
    return (
      <DiskRackCarousel items={diskItems} className={cn('min-h-[160px] flex-1', className)} />
    )
  }

  return (
    <div className={cn(gridVariantClasses[variant], className)}>
      {songs.map((song) => (
        <DraggableSongCard
          key={song.id}
          song={song}
          songs={songs}
          pathname={pathname}
          router={router}
          hasUser={hasUser}
          variant={variant}
          onSongSelect={onSongSelect}
        />
      ))}
    </div>
  )
}
