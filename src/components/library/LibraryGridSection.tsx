'use client'

import { HeartIcon, MusicalNoteIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { RadioIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'

interface GridItem {
  id: string
  type: 'playlist' | 'radio' | 'artist' | 'liked' | 'genre'
  title: string
  subtitle?: string
  imageUrl?: string
  gradient?: string
  href?: string
}

const mockGridItems: GridItem[] = [
  {
    id: '1',
    type: 'liked',
    title: 'Titres likés',
    gradient: 'from-purple-500 to-pink-500',
    href: '/songs?filter=liked'
  },
  {
    id: '2',
    type: 'playlist',
    title: 'Peaceful Guitar',
    subtitle: 'Playlist',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    href: '/playlists'
  },
  {
    id: '3',
    type: 'radio',
    title: 'Radio Patadas de Ahogado',
    subtitle: 'Radio',
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop',
    href: '/library'
  },
  {
    id: '4',
    type: 'artist',
    title: 'Shlomo',
    subtitle: 'Artiste',
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=400&fit=crop',
    href: '/library'
  },
  {
    id: '5',
    type: 'playlist',
    title: 'chill lofi study beats',
    subtitle: 'Playlist',
    imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
    href: '/playlists'
  },
  {
    id: '6',
    type: 'genre',
    title: 'Rock',
    subtitle: 'Genre',
    gradient: 'from-red-500 to-orange-500',
    href: '/library?genre=Rock'
  },
  {
    id: '7',
    type: 'genre',
    title: 'Pop',
    subtitle: 'Genre',
    gradient: 'from-blue-500 to-purple-500',
    href: '/library?genre=Pop'
  },
  {
    id: '8',
    type: 'playlist',
    title: 'Best of Amir',
    subtitle: 'Playlist',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop',
    href: '/playlists'
  }
]

export default function LibraryGridSection() {
  const getIcon = (type: GridItem['type']) => {
    switch (type) {
      case 'liked':
        return <HeartIcon className="h-12 w-12 text-white" />
      case 'playlist':
        return <SparklesIcon className="h-12 w-12 text-white" />
      case 'radio':
        return <RadioIcon className="h-12 w-12 text-white" />
      case 'artist':
        return <MusicalNoteIcon className="h-12 w-12 text-white" />
      default:
        return <MusicalNoteIcon className="h-12 w-12 text-white" />
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {mockGridItems.map((item) => {
        const content = (
          <div className="group relative h-24 sm:h-28 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl">
            {item.imageUrl ? (
              <div className="absolute inset-0">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              </div>
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient || 'from-gray-500 to-gray-700'}`} />
            )}
            
            <div className="absolute inset-0 flex items-center justify-center">
              {!item.imageUrl && (
                <div className="scale-75 sm:scale-100">
                  {getIcon(item.type)}
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <div className="font-bold text-white text-xs sm:text-sm truncate">
                {item.title}
              </div>
              {item.subtitle && (
                <div className="text-white/80 text-[10px] sm:text-xs truncate">
                  {item.subtitle}
                </div>
              )}
            </div>
          </div>
        )

        if (item.href) {
          return (
            <Link key={item.id} href={item.href}>
              {content}
            </Link>
          )
        }

        return <div key={item.id}>{content}</div>
      })}
    </div>
  )
}
