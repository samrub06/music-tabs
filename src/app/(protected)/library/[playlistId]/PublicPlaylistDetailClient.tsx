'use client'

import { useRouter } from 'next/navigation'
import {
  PlayIcon,
  MusicalNoteIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { useAuthContext } from '@/context/AuthContext'
import { Playlist, Song } from '@/types'
import { addSongToLibraryAction } from '@/app/(protected)/dashboard/actions'
import { savePublicPlaylistAsFolderAction } from '@/app/(protected)/library/actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SongThumbnail } from '@/components/presentational/SongThumbnail'
import { usePlaylistCover } from '@/lib/hooks/usePlaylistCover'
import { useLandscapeMobile } from '@/lib/hooks/useLandscapeMobile'
import SongGallery from '@/components/SongGallery'
import { PlaylistGlassHeader } from '@/components/library/PlaylistGlassHeader'
import { UI_TEXT_ALIGN } from '@/utils/rtl'
import Snackbar from '@/components/Snackbar'
import {
  createContext,
  useState,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react'

interface PublicPlaylistSearchContextValue {
  songs: Song[]
  setSongs: (songs: Song[]) => void
  handleStartPlaylist: () => void
  preferListView: boolean
  setPreferListView: (value: boolean) => void
  isSavingPlaylist: boolean
  handleSaveToFolders: () => Promise<void>
  snackbarMessage: string | null
  snackbarType: 'success' | 'error'
  showSnackbar: boolean
  setShowSnackbar: (value: boolean) => void
}

const PublicPlaylistSearchContext = createContext<PublicPlaylistSearchContextValue | null>(null)

function usePublicPlaylistSearch() {
  const context = useContext(PublicPlaylistSearchContext)
  if (!context) {
    throw new Error('usePublicPlaylistSearch must be used within PublicPlaylistSearchProvider')
  }
  return context
}

function storePlaylistNavigation(
  playlist: Playlist,
  songs: Song[],
  songId: string,
  sourceUrl: string
) {
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
      sourceUrl,
      playlistContext,
    })
  )
  sessionStorage.removeItem('hasUsedNext')
}

export function PublicPlaylistSearchProvider({
  playlist,
  children,
}: {
  playlist: Playlist
  children: ReactNode
}) {
  const router = useRouter()
  const [songs, setSongs] = useState<Song[]>([])
  const [preferListView, setPreferListView] = useState(false)
  const isLandscapeMobile = useLandscapeMobile()
  const {
    isSaving,
    snackbarMessage,
    snackbarType,
    showSnackbar,
    setShowSnackbar,
    handleSaveToFolders,
  } = useSavePublicPlaylistToFolders(playlist)

  useEffect(() => {
    if (!isLandscapeMobile) setPreferListView(false)
  }, [isLandscapeMobile])

  const handleStartPlaylist = useCallback(() => {
    if (songs.length === 0) return
    storePlaylistNavigation(playlist, songs, songs[0].id, `/library/${playlist.id}`)
    router.push(`/song/${songs[0].id}`)
  }, [songs, playlist, router])

  const value = useMemo(
    () => ({
      songs,
      setSongs,
      handleStartPlaylist,
      preferListView,
      setPreferListView,
      isSavingPlaylist: isSaving,
      handleSaveToFolders,
      snackbarMessage,
      snackbarType,
      showSnackbar,
      setShowSnackbar,
    }),
    [
      songs,
      handleStartPlaylist,
      preferListView,
      isSaving,
      handleSaveToFolders,
      snackbarMessage,
      snackbarType,
      showSnackbar,
      setShowSnackbar,
    ]
  )

  return (
    <PublicPlaylistSearchContext.Provider value={value}>
      {children}
    </PublicPlaylistSearchContext.Provider>
  )
}

function useSavePublicPlaylistToFolders(playlist: Playlist) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null)
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success')
  const [showSnackbar, setShowSnackbar] = useState(false)

  const handleSaveToFolders = useCallback(async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const result = await savePublicPlaylistAsFolderAction(playlist.id)
      setSnackbarType('success')
      setSnackbarMessage(
        t('library.addedPlaylistToFolders')
          .replace('{name}', result.folderName)
          .replace('{count}', String(result.songCount))
      )
      setShowSnackbar(true)
      router.push('/playlists')
      router.refresh()
    } catch (error) {
      console.error('Error saving playlist to folders:', error)
      setSnackbarType('error')
      setSnackbarMessage(
        error instanceof Error && error.message === 'AUTH_REQUIRED'
          ? t('library.signInToAddPlaylist')
          : t('library.addPlaylistError')
      )
      setShowSnackbar(true)
    } finally {
      setIsSaving(false)
    }
  }, [isSaving, playlist.id, router, t])

  return {
    isSaving,
    snackbarMessage,
    snackbarType,
    showSnackbar,
    setShowSnackbar,
    handleSaveToFolders,
  }
}

function PublicPlaylistHeader({
  playlist,
  songCount,
  canSaveToFolders,
  coverUrl,
}: {
  playlist: Playlist
  songCount: number
  canSaveToFolders: boolean
  coverUrl: string | null
}) {
  const { t } = useLanguage()
  const { signInWithGoogle } = useAuthContext()
  const isLandscapeMobile = useLandscapeMobile()
  const {
    songs,
    handleStartPlaylist,
    preferListView,
    isSavingPlaylist,
    handleSaveToFolders,
    snackbarMessage,
    snackbarType,
    showSnackbar,
    setShowSnackbar,
  } = usePublicPlaylistSearch()

  const handleAdd = () => {
    if (canSaveToFolders) {
      void handleSaveToFolders()
      return
    }
    void signInWithGoogle(`/library/${playlist.id}`)
  }

  const hideGlassHeader = isLandscapeMobile && !preferListView

  return (
    <>
      {hideGlassHeader ? null : (
        <PlaylistGlassHeader
          coverUrl={coverUrl}
          title={playlist.name}
          songCount={songCount}
          songs={songs}
          onPlay={handleStartPlaylist}
          onAdd={handleAdd}
          canAdd={!isSavingPlaylist && (canSaveToFolders ? songCount > 0 : true)}
          isAdding={isSavingPlaylist}
          addLabel={
            canSaveToFolders
              ? isSavingPlaylist
                ? t('library.addingPlaylist')
                : t('library.addPlaylistToFolders')
              : t('library.signInToAddPlaylist')
          }
          addAriaLabel={
            canSaveToFolders
              ? t('library.addPlaylistToFolders')
              : t('library.signInToAddPlaylist')
          }
        />
      )}

      <Snackbar
        message={snackbarMessage || ''}
        isOpen={showSnackbar}
        onClose={() => setShowSnackbar(false)}
        type={snackbarType}
      />
    </>
  )
}

interface PublicPlaylistDetailShellProps {
  playlist: Playlist
  songCount: number
  canSaveToFolders?: boolean
}

export function PublicPlaylistDetailShell({
  playlist,
  songCount,
  canSaveToFolders = false,
}: PublicPlaylistDetailShellProps) {
  const coverUrl = usePlaylistCover(playlist)

  return (
    <PublicPlaylistHeader
      playlist={playlist}
      songCount={songCount}
      canSaveToFolders={canSaveToFolders}
      coverUrl={coverUrl}
    />
  )
}

/** Scroll frame with landscape-aware bottom padding for the mobile nav. */
export function PublicPlaylistPageFrame({ children }: { children: ReactNode }) {
  const isLandscapeMobile = useLandscapeMobile()

  return (
    <div
      className={cn(
        'flex flex-1 flex-col lg:pb-6',
        isLandscapeMobile
          ? 'min-h-0 overflow-hidden pb-0'
          : 'overflow-y-auto pb-20'
      )}
    >
      {children}
    </div>
  )
}

export function PublicPlaylistSongListSkeleton() {
  return (
    <ul className="mt-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-2.5 sm:gap-4 sm:py-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-md bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  )
}

interface PublicPlaylistSongListProps {
  playlist: Playlist
  songs: Song[]
  userId?: string
  libraryCatalogIds?: string[]
}

export function PublicPlaylistSongList({
  playlist,
  songs,
  userId,
  libraryCatalogIds = [],
}: PublicPlaylistSongListProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { signInWithGoogle } = useAuthContext()
  const isLandscapeMobile = useLandscapeMobile()
  const coverUrl = usePlaylistCover(playlist)
  const [addingId, setAddingId] = useState<string | null>(null)
  const {
    setSongs,
    handleStartPlaylist,
    preferListView,
    setPreferListView,
    isSavingPlaylist,
    handleSaveToFolders,
  } = usePublicPlaylistSearch()
  const libraryIdSet = useMemo(() => new Set(libraryCatalogIds), [libraryCatalogIds])

  useEffect(() => {
    setSongs(songs)
    return () => setSongs([])
  }, [songs, setSongs])

  const handleAddToLibrary = useCallback(
    async (song: Song) => {
      if (!userId) {
        router.push('/login?next=/')
        return
      }

      try {
        setAddingId(song.id)
        await addSongToLibraryAction(song.id)
        router.refresh()
      } catch (error) {
        console.error('Error cloning song:', error)
      } finally {
        setAddingId(null)
      }
    },
    [userId, router]
  )

  const navigateToSong = useCallback(
    (songId: string) => {
      storePlaylistNavigation(playlist, songs, songId, `/library/${playlist.id}`)
      router.push(`/song/${songId}`)
    },
    [songs, playlist, router]
  )

  const handleAddPlaylist = useCallback(() => {
    if (userId) {
      void handleSaveToFolders()
      return
    }
    void signInWithGoogle(`/library/${playlist.id}`)
  }, [userId, handleSaveToFolders, signInWithGoogle, playlist.id])

  const showCarousel = isLandscapeMobile && !preferListView

  if (songs.length === 0) {
    return (
      <div className="px-4 py-16 text-center sm:px-6">
        <MusicalNoteIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-base font-medium text-foreground">
          {t('playlistView.noSongsInPlaylist')}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('playlistView.EMPTY_PLAYLIST_DESCRIPTION')}
        </p>
      </div>
    )
  }

  if (showCarousel) {
    return (
      <div className="flex min-h-0 flex-1 flex-col px-1.5 pt-0">
        <SongGallery
          songs={songs}
          variant="folder"
          diskRackOnLandscape
          onSongSelect={(song) => navigateToSong(song.id)}
          className="min-h-0 flex-1"
          playlistDock={{
            coverUrl,
            playlistTitle: playlist.name,
            songCount: songs.length,
            songs,
            onPlay: handleStartPlaylist,
            onShowList: () => setPreferListView(true),
            onAdd: handleAddPlaylist,
            canAdd: !isSavingPlaylist && (userId ? songs.length > 0 : true),
            isAdding: isSavingPlaylist,
            addAriaLabel: userId
              ? t('library.addPlaylistToFolders')
              : t('library.signInToAddPlaylist'),
          }}
        />
      </div>
    )
  }

  return (
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
      <ul className="mt-4">
        {songs.map((song) => {
          const isAdding = addingId === song.id
          const isInLibrary = libraryIdSet.has(song.id)

          return (
            <li key={song.id}>
              <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50 sm:gap-4 sm:py-3">
                <button
                  type="button"
                  onClick={() => navigateToSong(song.id)}
                  className="shrink-0"
                >
                  <SongThumbnail
                    songImageUrl={song.songImageUrl}
                    artistImageUrl={song.artistImageUrl}
                    genre={song.genre}
                    alt={song.title}
                    size="xs"
                  />
                </button>


              <button
                type="button"
                onClick={() => navigateToSong(song.id)}
                className={cn('min-w-0 flex-1', UI_TEXT_ALIGN)}
              >
                <p className="truncate text-sm font-medium text-foreground">{song.title}</p>
                {song.author ? (
                  <p className="truncate text-xs text-muted-foreground">{song.author}</p>
                ) : null}
              </button>

              <div className="flex shrink-0 items-center gap-1.5">
                {!isInLibrary ? (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-9 w-9 rounded-full sm:h-10 sm:w-10"
                    onClick={() => handleAddToLibrary(song)}
                    disabled={isAdding || !userId}
                    aria-label={t('library.addToLibrary')}
                    title={t('library.addToLibrary')}
                  >
                    {isAdding ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <PlusIcon className="h-4 w-4" />
                    )}
                  </Button>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigateToSong(song.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 sm:h-10 sm:w-10"
                  aria-label={t('search.viewSong')}
                >
                  <PlayIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
    </>
  )
}

interface PublicPlaylistDetailClientProps {
  playlist: Playlist
  songs: Song[]
  userId?: string
}

export default function PublicPlaylistDetailClient({
  playlist,
  songs,
  userId,
}: PublicPlaylistDetailClientProps) {
  return (
    <PublicPlaylistSearchProvider playlist={playlist}>
      <PublicPlaylistPageFrame>
        <PublicPlaylistDetailShell
          playlist={playlist}
          songCount={songs.length}
          canSaveToFolders={Boolean(userId)}
        />
        <PublicPlaylistSongList playlist={playlist} songs={songs} userId={userId} />
      </PublicPlaylistPageFrame>
    </PublicPlaylistSearchProvider>
  )
}
