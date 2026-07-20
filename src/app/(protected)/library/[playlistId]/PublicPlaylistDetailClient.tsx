'use client'

import { useRouter } from 'next/navigation'
import {
  PlayIcon,
  MusicalNoteIcon,
  PlusIcon,
  FolderPlusIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { useAuthContext } from '@/context/AuthContext'
import { Playlist, Song } from '@/types'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import { savePublicPlaylistAsFolderAction } from '@/app/(protected)/library/actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SongThumbnail } from '@/components/presentational/SongThumbnail'
import { usePlaylistCover } from '@/lib/hooks/usePlaylistCover'
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
    }),
    [songs, handleStartPlaylist]
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

function AddPlaylistCtaButton({
  onClick,
  disabled,
  isSaving,
  className,
}: {
  onClick: () => void
  disabled: boolean
  isSaving: boolean
  className?: string
}) {
  const { t } = useLanguage()

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group/wiggle h-12 w-full gap-2 rounded-xl text-sm font-semibold shadow-sm sm:h-14 sm:rounded-2xl sm:text-base',
        className
      )}
    >
      <FolderPlusIcon className="icon-hover-wiggle h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
      <span>
        {isSaving ? t('library.addingPlaylist') : t('library.addPlaylistToFolders')}
      </span>
    </Button>
  )
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
  const { songs, handleStartPlaylist } = usePublicPlaylistSearch()
  const {
    isSaving,
    snackbarMessage,
    snackbarType,
    showSnackbar,
    setShowSnackbar,
    handleSaveToFolders,
  } = useSavePublicPlaylistToFolders(playlist)

  const songCountLabel =
    songCount === 1
      ? `1 ${t('playlistView.songs').slice(0, -1)}`
      : `${songCount} ${t('playlistView.songs')}`

  const handleSignInToSave = () => {
    void signInWithGoogle(`/library/${playlist.id}`)
  }

  return (
    <>
      <div className="px-3 pt-3 sm:px-4 md:px-6">
        <div className="space-y-3 rounded-xl border border-black/[0.06] bg-card px-3 py-3 dark:border-white/[0.08] sm:px-4 sm:py-3.5">
          <div className="flex w-full items-start gap-2.5 sm:gap-3">
            <div className="relative h-14 w-14 shrink-0 self-start overflow-hidden rounded-xl bg-muted sm:h-16 sm:w-16">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/80 to-primary">
                  <MusicalNoteIcon className="h-7 w-7 text-primary-foreground/90" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 self-center">
              <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-base">
                {playlist.name}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground sm:text-xs">{songCountLabel}</p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 self-center">
              <button
                type="button"
                onClick={handleStartPlaylist}
                disabled={songs.length === 0}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12"
                aria-label={t('playlistView.startPlaylist')}
              >
                <PlayIcon className="h-5 w-5 animate-play-icon-rotate sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {canSaveToFolders ? (
            <AddPlaylistCtaButton
              onClick={() => void handleSaveToFolders()}
              disabled={isSaving || songCount === 0}
              isSaving={isSaving}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleSignInToSave}
              className="group/wiggle flex h-12 w-full gap-2 rounded-xl text-sm font-semibold sm:h-14 sm:text-base"
            >
              <FolderPlusIcon className="icon-hover-wiggle h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
              {t('library.signInToAddPlaylist')}
            </Button>
          )}
        </div>
      </div>

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
  const [addingId, setAddingId] = useState<string | null>(null)
  const { setSongs } = usePublicPlaylistSearch()
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
        await cloneSongAction(song.id)
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

  const useCards = songs.length >= 10

  if (useCards) {
    return (
      <div className="mt-4 grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 sm:gap-4 sm:px-6 md:grid-cols-4 lg:grid-cols-5">
        {songs.map((song) => {
          const isAdding = addingId === song.id
          const isInLibrary = libraryIdSet.has(song.id)

          return (
            <div key={song.id} className="group min-w-0">
              <button
                type="button"
                onClick={() => navigateToSong(song.id)}
                className={cn('block w-full', UI_TEXT_ALIGN)}
              >
                <div className="relative mb-2 aspect-square overflow-hidden rounded-lg bg-muted shadow-md transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-lg">
                  <SongThumbnail
                    songImageUrl={song.songImageUrl}
                    artistImageUrl={song.artistImageUrl}
                    genre={song.genre}
                    alt={song.title}
                    size="lg"
                    className="h-full w-full rounded-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      <PlayIcon className="ml-0.5 h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                </div>
                <p className="truncate text-sm font-medium text-foreground">{song.title}</p>
                {song.author ? (
                  <p className="truncate text-xs text-muted-foreground">{song.author}</p>
                ) : null}
              </button>
              {!isInLibrary ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2 h-8 w-full text-xs"
                  onClick={() => handleAddToLibrary(song)}
                  disabled={isAdding || !userId}
                >
                  {isAdding ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      <PlusIcon className="mr-1 h-3.5 w-3.5" />
                      {t('library.addToLibrary')}
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>
    )
  }

  return (
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
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
        <PublicPlaylistDetailShell
          playlist={playlist}
          songCount={songs.length}
          canSaveToFolders={Boolean(userId)}
        />
        <PublicPlaylistSongList playlist={playlist} songs={songs} userId={userId} />
      </div>
    </PublicPlaylistSearchProvider>
  )
}
