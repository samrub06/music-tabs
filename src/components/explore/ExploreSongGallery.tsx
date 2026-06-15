'use client'

import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import type { Song } from '@/types'
import { useSongCover } from '@/lib/hooks/useSongCover'
import { SongCoverPlaceholder } from '@/components/presentational/SongCoverPlaceholder'
import { UI_TEXT_ALIGN } from '@/utils/rtl'
import { cn } from '@/lib/utils'

interface ExploreSongGalleryProps {
  songs: Song[]
}

function canOptimizeRemoteImage(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

function ExploreSongCard({
  song,
  songs,
  pathname,
  router,
}: {
  song: Song
  songs: Song[]
  pathname: string | null
  router: ReturnType<typeof useRouter>
}) {
  const coverUrl = useSongCover(song)

  const handleSongClick = () => {
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
    router.push(`/song/${song.id}`)
  }

  return (
    <div className="group relative flex flex-col gap-2">
      <button
        type="button"
        onClick={handleSongClick}
        className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted text-left"
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={song.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            unoptimized={!canOptimizeRemoteImage(coverUrl)}
          />
        ) : (
          <SongCoverPlaceholder className="h-full w-full" />
        )}
      </button>

      <button
        type="button"
        onClick={handleSongClick}
        className={cn('min-w-0 text-left', UI_TEXT_ALIGN)}
      >
        <h3 className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
          {song.title}
        </h3>
        <p className="truncate text-xs text-muted-foreground">{song.author}</p>
      </button>
    </div>
  )
}

export default function ExploreSongGallery({ songs }: ExploreSongGalleryProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {songs.map((song) => (
        <ExploreSongCard
          key={song.id}
          song={song}
          songs={songs}
          pathname={pathname}
          router={router}
        />
      ))}
    </div>
  )
}
