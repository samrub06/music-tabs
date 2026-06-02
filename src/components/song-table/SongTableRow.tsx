'use client'

import {
  Fragment,
  useEffect,
  useState,
  useTransition,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { Song, Folder } from '@/types'
import FolderDropdown from '@/components/FolderDropdown'
import { Bars3Icon, HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { SongThumbnail } from '@/components/presentational/SongThumbnail'
import { useRouter, usePathname } from 'next/navigation'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { toggleSongFavoriteAction } from '@/app/song/[id]/actions'
import { useLanguage } from '@/context/LanguageContext'

interface SongTableRowProps {
  song: Song
  songs: Song[]
  folders: Folder[]
  visibleColumns: string[]
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onFolderChange: (songId: string, folderId: string | undefined) => Promise<void>
  hasUser: boolean
  isSelectMode: boolean
}

export default function SongTableRow({
  song,
  songs,
  folders,
  visibleColumns,
  isSelected,
  onSelect,
  onFolderChange,
  hasUser,
  isSelectMode,
}: SongTableRowProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isLiked, setIsLiked] = useState(song.isLiked ?? false)
  const [isTogglingFavorite, startToggleFavorite] = useTransition()

  useEffect(() => {
    setIsLiked(song.isLiked ?? false)
  }, [song.id, song.isLiked])

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
    if (isDragging) return

    if (isSelectMode && hasUser) {
      onSelect(!isSelected)
      return
    }

    if (typeof window !== 'undefined') {
      const songList = songs.map((s) => s.id)
      const currentIndex = songs.findIndex((s) => s.id === song.id)
      const navigationData = {
        songList,
        currentIndex: currentIndex >= 0 ? currentIndex : 0,
        sourceUrl: pathname || window.location.pathname,
      }
      sessionStorage.setItem('songNavigation', JSON.stringify(navigationData))
      sessionStorage.removeItem('hasUsedNext')
    }

    router.push(`/song/${song.id}`)
  }

  const handleToggleFavorite = (e: MouseEvent) => {
    e.stopPropagation()
    if (!hasUser || isTogglingFavorite) return
    startToggleFavorite(async () => {
      try {
        const { isLiked: next } = await toggleSongFavoriteAction(song.id)
        setIsLiked(next)
      } catch (error) {
        console.error('Failed to toggle favorite:', error)
      }
    })
  }

  const metadataParts: ReactNode[] = []

  if (visibleColumns.includes('author') && song.author) {
    metadataParts.push(
      <span key="author" className="truncate">
        {song.author}
      </span>
    )
  }
  if (visibleColumns.includes('key') && song.key) {
    metadataParts.push(
      <span key="key" className="text-purple-600 dark:text-purple-400 font-medium shrink-0">
        🎵 {song.key}
      </span>
    )
  }
  if (visibleColumns.includes('rating') && song.rating) {
    metadataParts.push(
      <span key="rating" className="text-yellow-600 dark:text-yellow-400 font-medium shrink-0">
        ⭐ {song.rating.toFixed(1)}
      </span>
    )
  }
  if (visibleColumns.includes('reviews') && song.reviews && song.reviews > 0) {
    metadataParts.push(
      <span key="reviews" className="shrink-0">
        👥 {song.reviews}
      </span>
    )
  }
  if (visibleColumns.includes('difficulty') && song.difficulty) {
    metadataParts.push(
      <span key="difficulty" className="text-blue-600 dark:text-blue-400 shrink-0">
        🎸 {song.difficulty}
      </span>
    )
  }
  if (visibleColumns.includes('version') && song.version) {
    metadataParts.push(
      <span key="version" className="text-green-600 dark:text-green-400 shrink-0">
        v{song.version}
      </span>
    )
  }
  if (visibleColumns.includes('viewCount') && song.viewCount && song.viewCount > 0) {
    metadataParts.push(
      <span key="views" className="shrink-0">
        👁️ {song.viewCount}
      </span>
    )
  }
  if (visibleColumns.includes('updatedAt')) {
    metadataParts.push(
      <span key="updated" className="shrink-0">
        {new Date(song.updatedAt).toLocaleDateString('fr-FR')}
      </span>
    )
  }

  return (
    <li
      ref={setNodeRef}
      data-song-id={song.id}
      style={{
        ...style,
        touchAction: hasUser ? 'none' : 'auto',
      }}
      className={isDragging ? 'relative z-50 opacity-50' : undefined}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleSongClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleSongClick()
          }
        }}
        className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-muted/50 sm:gap-3 sm:py-3"
      >
        {hasUser && isSelectMode && (
          <div
            className="flex shrink-0 items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="sm:hidden"
              {...listeners}
              {...attributes}
              onClick={(e) => e.stopPropagation()}
            >
              <Bars3Icon
                className="h-4 w-4 cursor-grab text-muted-foreground active:cursor-grabbing"
                style={{ touchAction: 'none' }}
              />
            </div>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation()
                onSelect(e.target.checked)
              }}
              className="-ml-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:ml-0 sm:h-4 sm:w-4"
            />
          </div>
        )}

        {visibleColumns.includes('title') && (
          <SongThumbnail
            songImageUrl={song.songImageUrl}
            artistImageUrl={song.artistImageUrl}
            alt={song.title}
            size="xs"
          />
        )}

        <div className="min-w-0 flex-1">
          {visibleColumns.includes('title') && (
            <p className="truncate text-sm font-medium text-foreground">{song.title}</p>
          )}
          {metadataParts.length > 0 && (
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              {metadataParts.map((part, index) => (
                <Fragment key={index}>
                  {index > 0 ? (
                    <span className="text-border" aria-hidden>
                      •
                    </span>
                  ) : null}
                  {part}
                </Fragment>
              ))}
            </p>
          )}
        </div>

        {visibleColumns.includes('folder') && !isSelectMode && (
          <div className="hidden shrink-0 sm:block" onClick={(e) => e.stopPropagation()}>
            <FolderDropdown
              currentFolderId={song.folderId}
              folders={folders}
              onFolderChange={(newFolderId) => onFolderChange(song.id, newFolderId)}
              disabled={!hasUser}
            />
          </div>
        )}

        {hasUser && (
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className="ms-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-60"
            aria-label={
              isLiked ? t('library.removeFromFavorites') : t('library.addToFavorites')
            }
          >
            {isLiked ? (
              <HeartSolidIcon className="h-5 w-5" aria-hidden />
            ) : (
              <HeartIcon className="h-5 w-5" aria-hidden />
            )}
          </button>
        )}
      </div>
    </li>
  )
}
