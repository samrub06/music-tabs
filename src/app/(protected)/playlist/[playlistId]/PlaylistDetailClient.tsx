'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlayIcon,
  MusicalNoteIcon,
  ArrowLeftIcon,
  Bars3Icon,
  EllipsisHorizontalIcon,
  TrashIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { Playlist, Song } from '@/types'
import { removeSongFromPlaylistAction, updatePlaylistOrderAction } from './actions'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getPlaylistDisplayCoverUrl } from '@/utils/playlistCover'
import { SongThumbnail } from '@/components/presentational/SongThumbnail'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PlaylistDetailClientProps {
  playlist: Playlist
  songs: Song[]
}

function SortableSongItem({
  song,
  isDragging,
  onRemove,
  t,
}: {
  song: Song
  isDragging: boolean
  onRemove: (songId: string) => void
  t: (key: string) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: song.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const router = useRouter()

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'relative z-50 opacity-50')}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50 sm:gap-4 sm:py-3">
        <div
          {...attributes}
          {...listeners}
          className="flex shrink-0 cursor-grab touch-none rounded-md p-1 active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          aria-label="Reorder"
        >
          <Bars3Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        <SongThumbnail
          songImageUrl={song.songImageUrl}
          artistImageUrl={song.artistImageUrl}
          alt={song.title}
          size="xs"
        />

        <button
          type="button"
          onClick={() => router.push(`/song/${song.id}`)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-medium text-foreground">{song.title}</p>
          <p className="truncate text-xs text-muted-foreground">{song.author}</p>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t('songs.moreActions')}
            >
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push(`/song/${song.id}`)}>
              {t('search.viewSong')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onRemove(song.id)}
            >
              <TrashIcon className="h-4 w-4" />
              {t('playlistView.removeFromPlaylist')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}

function PlaylistSongRow({ song }: { song: Song }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 sm:gap-4 sm:py-3">
      <SongThumbnail
        songImageUrl={song.songImageUrl}
        artistImageUrl={song.artistImageUrl}
        alt={song.title}
        size="xs"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{song.title}</p>
        <p className="truncate text-xs text-muted-foreground">{song.author}</p>
      </div>
    </div>
  )
}

export default function PlaylistDetailClient({
  playlist,
  songs: initialSongs,
}: PlaylistDetailClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [songs, setSongs] = useState(initialSongs)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)

  const openShareDialog = useCallback(() => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/playlist/${playlist.id}`
        : `/playlist/${playlist.id}`
    setShareUrl(url)
    setShareOpen(true)
  }, [playlist.id])

  const handleCopyShareLink = useCallback(async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      window.setTimeout(() => setLinkCopied(false), 2500)
    } catch (error) {
      console.error('Failed to copy playlist link:', error)
    }
  }, [shareUrl])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const songIds = useMemo(() => songs.map((s) => s.id), [songs])

  const coverUrl =
    getPlaylistDisplayCoverUrl(playlist) ??
    songs[0]?.songImageUrl ??
    songs[0]?.artistImageUrl ??
    null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveId(null)
      return
    }

    const oldIndex = songIds.indexOf(active.id as string)
    const newIndex = songIds.indexOf(over.id as string)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newSongs = arrayMove(songs, oldIndex, newIndex)
      setSongs(newSongs)

      try {
        await updatePlaylistOrderAction(
          playlist.id,
          newSongs.map((s) => s.id)
        )
      } catch (error) {
        console.error('Error updating playlist order:', error)
        setSongs(songs)
      }
    }

    setActiveId(null)
  }

  const handleRemoveSong = async (songId: string) => {
    const previousSongs = songs
    const newSongs = songs.filter((s) => s.id !== songId)
    setSongs(newSongs)

    try {
      await removeSongFromPlaylistAction(playlist.id, songId)
    } catch (error) {
      console.error('Error removing song from playlist:', error)
      setSongs(previousSongs)
    }
  }

  const handleStartPlaylist = () => {
    if (songs.length === 0) return

    if (typeof window !== 'undefined') {
      const songList = songs.map((s) => s.id)
      const playlistContext = {
        isPlaylist: true,
        targetKey: '',
        songs: songs.map((s) => ({
          id: s.id,
          keyAdjustment: 0,
          originalKey: s.key || '',
          targetKey: s.key || '',
        })),
      }

      const navigationData = {
        songList,
        currentIndex: 0,
        sourceUrl: `/playlist/${playlist.id}`,
        playlistContext,
      }

      sessionStorage.setItem('songNavigation', JSON.stringify(navigationData))
      sessionStorage.removeItem('hasUsedNext')

      router.push(`/song/${songs[0].id}`)
    }
  }

  const activeSong = activeId ? songs.find((s) => s.id === activeId) : null

  const songCountLabel =
    songs.length === 1
      ? `1 ${t('playlistView.songs').slice(0, -1)}`
      : `${songs.length} ${t('playlistView.songs')}`

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
      <div className="relative h-40 w-full overflow-hidden sm:h-auto sm:aspect-[5/2] sm:max-h-72">
        {coverUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 via-primary/10 to-muted">
            <MusicalNoteIcon className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push('/playlists')}
          className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
          aria-label={t('common.back')}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="min-w-0 flex-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {playlist.name}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openShareDialog}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-11 sm:w-11"
              aria-label={t('playlistView.sharePlaylist')}
            >
              <ShareIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleStartPlaylist}
              disabled={songs.length === 0}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-14"
              aria-label={t('playlistView.startPlaylist')}
            >
              <PlayIcon className="h-6 w-6 translate-x-0.5 sm:h-7 sm:w-7" />
            </button>
          </div>
        </div>

        {playlist.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {playlist.description}
          </p>
        ) : null}

        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
          {songCountLabel}
          {playlist.createdAt ? (
            <>
              {' · '}
              {new Date(playlist.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </>
          ) : null}
        </p>
      </div>

      {songs.length === 0 ? (
        <div className="px-4 py-16 text-center sm:px-6">
          <MusicalNoteIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-base font-medium text-foreground">
            {t('playlistView.noSongsInPlaylist')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('playlistView.addSongsToPlaylist')}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={songIds} strategy={verticalListSortingStrategy}>
            <ul className="mt-4">
              {songs.map((song) => (
                <SortableSongItem
                  key={song.id}
                  song={song}
                  isDragging={activeId === song.id}
                  onRemove={handleRemoveSong}
                  t={t}
                />
              ))}
            </ul>
          </SortableContext>
          <DragOverlay>
            {activeSong ? (
              <div className="rounded-lg bg-background/95 shadow-lg backdrop-blur-sm">
                <PlaylistSongRow song={activeSong} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('playlistView.sharePlaylist')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input readOnly value={shareUrl} className="text-sm" onFocus={(e) => e.target.select()} />
            <Button type="button" className="w-full" onClick={() => void handleCopyShareLink()}>
              {linkCopied ? t('songHeader.linkCopied') : t('playlistView.copyLink')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
