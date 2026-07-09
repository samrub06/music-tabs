'use client'

import {
  Fragment,
  useEffect,
  useState,
  useTransition,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { Song, Folder, Playlist } from '@/types'
import FolderDropdown from '@/components/FolderDropdown'
import {
  Bars3Icon,
  EllipsisVerticalIcon,
  HeartIcon,
  PencilSquareIcon,
  ShareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon, MusicalNoteIcon } from '@heroicons/react/24/solid'
import { useSongCover } from '@/lib/hooks/useSongCover'
import { SongCoverPlaceholder } from '@/components/presentational/SongCoverPlaceholder'
import { useRouter, usePathname } from 'next/navigation'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { toggleSongFavoriteAction } from '@/app/song/[id]/actions'
import { useLanguage } from '@/context/LanguageContext'
import ShareWithFriendDialog from '@/components/social/ShareWithFriendDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { UI_TEXT_ALIGN } from '@/utils/rtl'

interface SongTableRowProps {
  song: Song
  songs: Song[]
  folders: Folder[]
  songPlaylists?: Playlist[]
  visibleColumns: string[]
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onFolderChange: (songId: string, folderId: string | undefined) => Promise<void>
  onDeleteSong: (songId: string) => void
  hasUser: boolean
  isSelectMode: boolean
  isCoverExpanded?: boolean
  onToggleCover?: () => void
}

export default function SongTableRow({
  song,
  songs,
  folders,
  songPlaylists = [],
  visibleColumns,
  isSelected,
  onSelect,
  onFolderChange,
  onDeleteSong,
  hasUser,
  isSelectMode,
  isCoverExpanded = false,
  onToggleCover,
}: SongTableRowProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isLiked, setIsLiked] = useState(song.isLiked ?? false)
  const [isTogglingFavorite, startToggleFavorite] = useTransition()
  const [shareOpen, setShareOpen] = useState(false)

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

  const coverUrl = useSongCover(song)

  const handleToggleCover = (e: MouseEvent) => {
    e.stopPropagation()
    onToggleCover?.()
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
      style={style}
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
        className={cn(
          'flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-muted/50 sm:gap-3 sm:py-3',
          UI_TEXT_ALIGN
        )}
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
          <button
            type="button"
            onClick={handleToggleCover}
            className={cn(
              'h-9 w-9 shrink-0 overflow-hidden rounded-lg sm:h-10 sm:w-10',
              !coverUrl &&
                'flex items-center justify-center bg-gradient-to-br from-muted-foreground/40 via-muted to-muted-foreground/25',
              isCoverExpanded && 'ring-2 ring-primary/40'
            )}
            aria-label={song.title}
            aria-expanded={isCoverExpanded}
          >
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <MusicalNoteIcon className="h-5 w-5 text-foreground/35 dark:text-foreground/45 sm:h-6 sm:w-6" />
            )}
          </button>
        )}

        <div className={cn('min-w-0 flex-1', UI_TEXT_ALIGN)}>
          {visibleColumns.includes('title') && (
            <p className="truncate text-sm font-medium text-foreground">{song.title}</p>
          )}
          {metadataParts.length > 0 && (
            <p className="mt-0.5 flex flex-wrap items-center justify-start gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
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

        {visibleColumns.includes('playlist') && !isSelectMode && (
          <div
            className="hidden max-w-[11rem] shrink-0 sm:block"
            onClick={(e) => e.stopPropagation()}
            title={
              songPlaylists.length > 0
                ? songPlaylists.map((p) => p.name).join(', ')
                : t('admin.notInPlaylist')
            }
          >
            {songPlaylists.length > 0 ? (
              <div className="flex flex-wrap justify-end gap-1">
                {songPlaylists.slice(0, 2).map((playlist) => (
                  <span
                    key={playlist.id}
                    className="max-w-[7.5rem] truncate rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {playlist.name}
                  </span>
                ))}
                {songPlaylists.length > 2 && (
                  <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    +{songPlaylists.length - 2}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/70">{t('admin.notInPlaylist')}</span>
            )}
          </div>
        )}

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
          <div
            className="ms-auto flex shrink-0 items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-60"
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

            {!isSelectMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={t('songs.moreActions')}
                  >
                    <EllipsisVerticalIcon className="h-5 w-5" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push(`/song/${song.id}`)}>
                    <PencilSquareIcon className="me-2 h-4 w-4" aria-hidden />
                    {t('songs.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShareOpen(true)}>
                    <ShareIcon className="me-2 h-4 w-4" aria-hidden />
                    {t('friends.shareWithFriend')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDeleteSong(song.id)}
                  >
                    <TrashIcon className="me-2 h-4 w-4" aria-hidden />
                    {t('songs.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {isCoverExpanded && visibleColumns.includes('title') && (
        <div className="px-4 pb-3" onClick={(e) => e.stopPropagation()}>
          <div className="aspect-[2/1] w-full max-h-52 overflow-hidden rounded-xl bg-muted">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt={song.title} className="h-full w-full object-cover" />
            ) : (
              <SongCoverPlaceholder />
            )}
          </div>
        </div>
      )}

      <ShareWithFriendDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        entityType="song"
        entityId={song.id}
        entityTitle={song.title}
      />
    </li>
  )
}
