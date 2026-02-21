'use client'

import { HeartIcon, SparklesIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

export interface PublicPlaylistItem {
  id: string
  name: string
  imageUrl?: string
  songCount: number
}

interface LibraryGridSectionProps {
  publicPlaylists: PublicPlaylistItem[]
  showLikedCard?: boolean
}

export default function LibraryGridSection({ publicPlaylists, showLikedCard = true }: LibraryGridSectionProps) {
  const likedCard = showLikedCard ? (
    <Link
      key="liked"
      href="/songs?filter=liked"
      className="group relative h-24 sm:h-28 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500" />
      <div className="absolute inset-0 flex items-center justify-center">
        <HeartIcon className="h-12 w-12 text-white" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <div className="font-bold text-white text-xs sm:text-sm truncate">Titres likés</div>
      </div>
    </Link>
  ) : null

  const playlistCards = publicPlaylists.map((item) => (
    <Link
      key={item.id}
      href={`/library/${item.id}`}
      className="group relative h-24 sm:h-28 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl"
    >
      {item.imageUrl ? (
        <>
          <div className="absolute inset-0">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500">
          <div className="absolute inset-0 flex items-center justify-center">
            <SparklesIcon className="h-12 w-12 text-white" />
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <div className="font-bold text-white text-xs sm:text-sm truncate">{item.name}</div>
        <div className="text-white/80 text-[10px] sm:text-xs truncate">
          Playlist · {item.songCount} {item.songCount === 1 ? 'chanson' : 'chansons'}
        </div>
      </div>
    </Link>
  ))

  const items = [likedCard, ...playlistCards].filter(Boolean)

  if (items.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 lg:gap-4 mb-6">
      {items}
    </div>
  )
}
