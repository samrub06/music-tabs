'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlayIcon,
  MusicalNoteIcon,
  Bars3Icon,
  EllipsisHorizontalIcon,
  TrashIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { Playlist, Song } from '@/types'
import ShareWithFriendDialog from '@/components/social/ShareWithFriendDialog'
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
import { usePlaylistCover } from '@/lib/hooks/usePlaylistCover'
import { useSongCover } from '@/lib/hooks/useSongCover'
import { getPlaylistDisplayCoverUrl } from '@/utils/playlistCover'
import { SongThumbnail } from '@/components/presentational/SongThumbnail'
import { cn } from '@/lib/utils'
import { absoluteShareUrl } from '@/lib/seo/site'
import { useLandscapeMobile } from '@/lib/hooks/useLandscapeMobile'
import SongGallery from '@/components/SongGallery'
import { PlaylistGlassHeader } from '@/components/library/PlaylistGlassHeader'
import { GlassActionTile } from '@/components/library/GlassActionTile'
import { UI_TEXT_ALIGN } from '@/utils/rtl'
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
  onPlaySong,
  t,
  dragDisabled = false,
}: {
  song: Song
  isDragging: boolean
  onRemove: (songId: string) => void
  onPlaySong: (songId: string) => void
  t: (key: string) => string
  dragDisabled?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: song.id,
    disabled: dragDisabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'relative z-50 opacity-50')}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50 sm:gap-4 sm:py-3">
        {!dragDisabled ? (
          <div
            {...attributes}
            {...listeners}
            className="flex shrink-0 cursor-grab touch-none rounded-md p-1 active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            aria-label="Reorder"
          >
            <Bars3Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : null}

        <SongThumbnail
          songImageUrl={song.songImageUrl}
          artistImageUrl={song.artistImageUrl}
          genre={song.genre}
          alt={song.title}
          size="xs"
        />

        <button
          type="button"
          onClick={() => onPlaySong(song.id)}
          className={cn('min-w-0 flex-1', UI_TEXT_ALIGN)}
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
            <DropdownMenuItem onClick={() => onPlaySong(song.id)}>
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
        genre={song.genre}
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
  const isLandscapeMobile = useLandscapeMobile()
  const [songs, setSongs] = useState(initialSongs)
  const [preferListView, setPreferListView] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareWithFriendOpen, setShareWithFriendOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLandscapeMobile) setPreferListView(false)
  }, [isLandscapeMobile])

  const openShareDialog = useCallback(() => {
    setShareUrl(absoluteShareUrl(`/jams/${playlist.id}`))
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

  const filteredSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return songs
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(q) ||
        (song.author || '').toLowerCase().includes(q)
    )
  }, [songs, searchQuery])

  const isFiltering = searchQuery.trim().length > 0
  const displayedSongs = isFiltering ? filteredSongs : songs

  const openSearch = useCallback(() => {
    setIsSearchOpen(true)
    window.requestAnimationFrame(() => searchInputRef.current?.focus())
  }, [])

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
    setSearchQuery('')
    searchInputRef.current?.blur()
  }, [])

  const toggleSearch = useCallback(() => {
    if (isSearchOpen) {
      closeSearch()
    } else {
      openSearch()
    }
  }, [isSearchOpen, closeSearch, openSearch])

  const coverUrl = usePlaylistCover(playlist)
  const firstSong = songs[0]
  const songFallbackCover = useSongCover({
    songImageUrl: firstSong?.songImageUrl,
    artistImageUrl: firstSong?.artistImageUrl,
    genre: firstSong?.genre,
  })
  const hasOwnPlaylistCover = Boolean(getPlaylistDisplayCoverUrl(playlist))
  const displayCoverUrl = hasOwnPlaylistCover ? coverUrl : (songFallbackCover ?? null)

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

  const navigateToSong = useCallback(
    (songId: string) => {
      if (typeof window === 'undefined') return

      const songList = songs.map((s) => s.id)
      const currentIndex = songList.indexOf(songId)
      const playlistContext = {
        isPlaylist: true,
        targetKey: '',
        songs: songs.map((s) => ({
          id: s.id,
          title: s.title,
          author: s.author,
          songImageUrl: s.songImageUrl,
          artistImageUrl: s.artistImageUrl,
          keyAdjustment: 0,
          originalKey: s.key || '',
          targetKey: s.key || '',
        })),
      }

      sessionStorage.setItem(
        'songNavigation',
        JSON.stringify({
          songList,
          currentIndex: currentIndex >= 0 ? currentIndex : 0,
          sourceUrl: `/jams/${playlist.id}`,
          playlistContext,
        })
      )
      sessionStorage.removeItem('hasUsedNext')

      router.push(`/song/${songId}`)
    },
    [songs, playlist.id, router]
  )

  const handleStartPlaylist = () => {
    if (songs.length === 0) return
    navigateToSong(songs[0].id)
  }

  const showCarousel = isLandscapeMobile && !preferListView

  const activeSong = activeId ? songs.find((s) => s.id === activeId) : null

  const songCountLabel =
    songs.length === 1
      ? `1 ${t('playlistView.songs').slice(0, -1)}`
      : `${songs.length} ${t('playlistView.songs')}`

  const jamToolbar = (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center justify-end',
        isLandscapeMobile ? 'gap-1' : 'gap-1.5'
      )}
    >
      {!isSearchOpen ? (
        <GlassActionTile
          onClick={openShareDialog}
          compact={isLandscapeMobile}
          aria-label={t('playlistView.sharePlaylist')}
          className={isLandscapeMobile ? '!h-8 !w-8' : '!h-10 !w-10'}
        >
          <ShareIcon />
        </GlassActionTile>
      ) : null}

      <div
        className={cn(
          'flex min-w-0 items-center overflow-hidden border border-white/25 bg-white/40 backdrop-blur-md transition-all duration-200 dark:bg-white/10',
          isLandscapeMobile ? 'rounded-xl' : 'rounded-2xl',
          isSearchOpen
            ? 'min-w-0 flex-1'
            : cn('shrink-0 border-transparent bg-transparent', isLandscapeMobile ? 'w-8' : 'w-10')
        )}
      >
        <GlassActionTile
          onClick={toggleSearch}
          compact={isLandscapeMobile}
          aria-label={isSearchOpen ? t('common.close') : t('common.search')}
          className={cn(
            isLandscapeMobile ? '!h-8 !w-8' : '!h-10 !w-10',
            isSearchOpen && 'text-primary'
          )}
        >
          <MagnifyingGlassIcon />
        </GlassActionTile>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeSearch()
          }}
          placeholder={t('songs.search')}
          tabIndex={isSearchOpen ? 0 : -1}
          aria-hidden={!isSearchOpen}
          className={cn(
            'min-w-0 border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200',
            isLandscapeMobile ? 'text-xs' : 'text-sm',
            isSearchOpen ? 'w-full pe-2 opacity-100' : 'w-0 pe-0 opacity-0'
          )}
        />
        {isSearchOpen && searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className={cn(
              'inline-flex shrink-0 items-center justify-center text-muted-foreground',
              isLandscapeMobile ? 'h-8 w-8' : 'h-10 w-10'
            )}
            aria-label={t('common.clear')}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  )

  return (
    <div
      className={cn(
        'flex flex-1 flex-col lg:pb-6',
        isLandscapeMobile
          ? 'min-h-0 overflow-hidden pb-0'
          : 'overflow-y-auto pb-20'
      )}
    >
      {showCarousel ? null : (
        <PlaylistGlassHeader
          coverUrl={displayCoverUrl}
          title={playlist.name}
          songCount={songs.length}
          songs={songs}
          onPlay={handleStartPlaylist}
          toolbar={jamToolbar}
          subtitle={
            playlist.description ? (
              playlist.description
            ) : playlist.createdAt ? (
              <>
                {songCountLabel}
                {' · '}
                {new Date(playlist.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </>
            ) : (
              songCountLabel
            )
          }
        />
      )}

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
      ) : isFiltering && displayedSongs.length === 0 ? (
        <div className="px-4 py-16 text-center sm:px-6">
          <MagnifyingGlassIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-base font-medium text-foreground">{t('songs.noResults')}</h3>
        </div>
      ) : showCarousel ? (
        <div className="flex min-h-0 flex-1 flex-col px-1.5 pt-0">
          <SongGallery
            songs={displayedSongs}
            variant="folder"
            diskRackOnLandscape
            onSongSelect={(song) => navigateToSong(song.id)}
            className="min-h-0 flex-1"
            playlistDock={{
              coverUrl: displayCoverUrl,
              playlistTitle: playlist.name,
              songCount: songs.length,
              songs: displayedSongs,
              onPlay: handleStartPlaylist,
              onShowList: () => setPreferListView(true),
            }}
          />
        </div>
      ) : isFiltering ? (
        <>
          {isLandscapeMobile && preferListView ? (
            <div className="flex justify-end px-3 pt-1">
              <button
                type="button"
                onClick={() => setPreferListView(false)}
                className="text-xs font-medium text-primary hover:underline"
              >
                {t('library.showCarouselView')}
              </button>
            </div>
          ) : null}
          <DndContext sensors={sensors} collisionDetection={closestCenter}>
            <SortableContext
              items={displayedSongs.map((song) => song.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="mt-4">
                {displayedSongs.map((song) => (
                  <SortableSongItem
                    key={song.id}
                    song={song}
                    isDragging={false}
                    onRemove={handleRemoveSong}
                    onPlaySong={navigateToSong}
                    t={t}
                    dragDisabled
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </>
      ) : (
        <>
          {isLandscapeMobile && preferListView ? (
            <div className="flex justify-end px-3 pt-1">
              <button
                type="button"
                onClick={() => setPreferListView(false)}
                className="text-xs font-medium text-primary hover:underline"
              >
                {t('library.showCarouselView')}
              </button>
            </div>
          ) : null}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={songIds} strategy={verticalListSortingStrategy}>
              <ul className="mt-4">
                {displayedSongs.map((song) => (
                  <SortableSongItem
                    key={song.id}
                    song={song}
                    isDragging={activeId === song.id}
                    onRemove={handleRemoveSong}
                    onPlaySong={navigateToSong}
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
        </>
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
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setShareOpen(false)
                setShareWithFriendOpen(true)
              }}
            >
              {t('friends.shareWithFriend')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ShareWithFriendDialog
        open={shareWithFriendOpen}
        onOpenChange={setShareWithFriendOpen}
        entityType="playlist"
        entityId={playlist.id}
        entityTitle={playlist.name}
      />
    </div>
  )
}
