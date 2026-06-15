'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline'
import type { Song } from '@/types'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

interface SongGalleryProps {
  songs: Song[]
  showAddButton?: boolean
  onAddClick?: (song: Song) => void
  addingId?: string | null
  hasUser?: boolean
}

// Draggable song card component
function DraggableSongCard({ 
  song, 
  songs, 
  pathname, 
  router, 
  hasUser,
}: { 
  song: Song
  songs: Song[]
  pathname: string | null
  router: any
  hasUser?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: song.id,
    disabled: !hasUser,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex flex-col gap-2',
        isDragging && 'z-50 opacity-75'
      )}
    >
      <div
        onClick={handleSongClick}
        className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl bg-muted"
      >
        {song.songImageUrl ? (
          <img
            src={song.songImageUrl}
            alt={song.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : null}

        {hasUser && (
          <div
            {...listeners}
            {...attributes}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2 right-2 z-10 touch-none rounded-md bg-background/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-background active:cursor-grabbing cursor-grab"
            style={{ touchAction: 'none' }}
            aria-label="Drag to move song"
          >
            <ArrowsUpDownIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

      </div>

      <div onClick={handleSongClick} className="min-w-0 cursor-pointer space-y-0.5">
        <h3 className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
          {song.title}
        </h3>
        <p className="truncate text-xs text-muted-foreground">{song.author}</p>
      </div>
    </div>
  )
}

export default function SongGallery({ songs, hasUser = false }: SongGalleryProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {songs.map((song) => (
        <DraggableSongCard
          key={song.id}
          song={song}
          songs={songs}
          pathname={pathname}
          router={router}
          hasUser={hasUser}
        />
      ))}
    </div>
  )
}

