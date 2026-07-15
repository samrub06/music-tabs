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

interface SongGalleryProps {
  songs: Song[]
  showAddButton?: boolean
  onAddClick?: (song: Song) => void
  addingId?: string | null
  hasUser?: boolean
  variant?: 'default' | 'compact' | 'folder'
}

const gridVariantClasses = {
  default:
    'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  compact:
    'grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7',
  folder:
    'grid grid-cols-5 gap-2 sm:grid-cols-5 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7',
} as const

// Draggable song card component
function DraggableSongCard({
  song,
  songs,
  pathname,
  router,
  hasUser,
  variant = 'default',
}: {
  song: Song
  songs: Song[]
  pathname: string | null
  router: any
  hasUser?: boolean
  variant?: 'default' | 'compact' | 'folder'
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
    // Don't navigate if dragging
    if (isDragging) return
    
    // Save song list to sessionStorage for navigation
    if (typeof window !== 'undefined') {
      const songList = songs.map(s => s.id)
      const currentIndex = songs.findIndex(s => s.id === song.id)
      const navigationData = {
        songList,
        currentIndex: currentIndex >= 0 ? currentIndex : 0,
        sourceUrl: pathname || window.location.pathname
      }
      sessionStorage.setItem('songNavigation', JSON.stringify(navigationData))
      sessionStorage.removeItem('hasUsedNext') // Reset hasUsedNext when navigating to a new song
    }
    
    // Navigate to song page
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
}: SongGalleryProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className={gridVariantClasses[variant]}>
      {songs.map((song) => (
        <DraggableSongCard
          key={song.id}
          song={song}
          songs={songs}
          pathname={pathname}
          router={router}
          hasUser={hasUser}
          variant={variant}
        />
      ))}
    </div>
  )
}

