'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowPathIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAuthContext } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { usePageHeader } from '@/context/PageHeaderContext'
import type { Folder } from '@/types'
import type { ImportProgress, ImportResult } from '@/lib/services/simplePlaylistImporter'
import type { SpotifyPlaylistSummary } from '@/lib/services/spotifyService'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SpotifyImportClientProps {
  isConfigured: boolean
  isConnected: boolean
  folders: Folder[]
}

type SpotifyStatus =
  | 'connected'
  | 'denied'
  | 'not_configured'
  | 'unauthorized'
  | 'invalid_state'
  | 'already_linked'
  | 'failed'

export default function SpotifyImportClient({
  isConfigured,
  isConnected: initialConnected,
  folders,
}: SpotifyImportClientProps) {
  const { t } = useLanguage()
  const { user, session, profile, signInWithGoogle, refetchProfile } = useAuthContext()
  const router = useRouter()
  const searchParams = useSearchParams()

  usePageHeader(t('spotifyImport.title'), '/search')

  const [isConnected, setIsConnected] = useState(initialConnected || !!profile?.spotify_id)
  const [playlists, setPlaylists] = useState<SpotifyPlaylistSummary[]>([])
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false)
  const [playlistsError, setPlaylistsError] = useState<string | null>(null)
  const [needsReconnect, setNeedsReconnect] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState('')
  const [importingPlaylistId, setImportingPlaylistId] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const spotifyStatus = searchParams.get('spotify') as SpotifyStatus | null

  useEffect(() => {
    setIsConnected(initialConnected || !!profile?.spotify_id)
  }, [initialConnected, profile?.spotify_id])

  useEffect(() => {
    if (!spotifyStatus) return

    const key = `library.spotifyStatus.${spotifyStatus}`
    const translated = t(key)
    if (translated !== key) {
      setStatusMessage(translated)
    }

    if (spotifyStatus === 'connected') {
      void refetchProfile()
      setIsConnected(true)
      setNeedsReconnect(false)
    }

    const url = new URL(window.location.href)
    url.searchParams.delete('spotify')
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false })
  }, [spotifyStatus, refetchProfile, router, t])

  const loadPlaylists = useCallback(async () => {
    if (!isConnected) return

    setIsLoadingPlaylists(true)
    setPlaylistsError(null)
    setNeedsReconnect(false)

    try {
      // Cookie session is enough — /api/spotify/playlists uses createActionServerClient().
      const response = await fetch('/api/spotify/playlists', { credentials: 'include' })

      const payload = (await response.json()) as {
        playlists?: SpotifyPlaylistSummary[]
        error?: string
        details?: string
        reconnectRequired?: boolean
      }

      if (!response.ok) {
        const details = payload.details || payload.error || 'Failed to load playlists'
        setNeedsReconnect(Boolean(payload.reconnectRequired))
        throw new Error(details)
      }

      setPlaylists(payload.playlists ?? [])
    } catch (error) {
      setPlaylistsError(error instanceof Error ? error.message : t('spotifyImport.loadPlaylistsError'))
    } finally {
      setIsLoadingPlaylists(false)
    }
  }, [isConnected, t])

  useEffect(() => {
    if (isConnected) {
      void loadPlaylists()
    }
  }, [isConnected, loadPlaylists])

  const filteredPlaylists = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const withLabels = playlists.map((playlist) =>
      playlist.id === 'liked'
        ? { ...playlist, name: t('spotifyImport.likedSongs') }
        : playlist
    )
    if (!query) return withLabels
    return withLabels.filter((playlist) => playlist.name.toLowerCase().includes(query))
  }, [playlists, searchQuery, t])

  const handleConnect = (force = false) => {
    const authPath = force ? '/api/spotify/auth?force=1' : '/api/spotify/auth'
    if (!user) {
      void signInWithGoogle(authPath)
      return
    }
    window.location.assign(authPath)
  }

  const handleImport = async (playlist: SpotifyPlaylistSummary) => {
    if (importingPlaylistId) return

    setImportingPlaylistId(playlist.id)
    setImportResult(null)
    setImportProgress({
      current: 0,
      total: 0,
      currentSong: t('spotifyImport.starting'),
      status: 'parsing',
    })

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      // Prefer cookie auth path once available; Bearer still works for streaming import.
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/spotify/import', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          playlistId: playlist.id,
          targetFolderId: selectedFolderId || null,
          useAiOrganization: false,
        }),
      })

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { details?: string; error?: string } | null
        throw new Error(payload?.details || payload?.error || t('spotifyImport.importFailed'))
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6)) as {
            type: 'progress' | 'complete' | 'error'
            data: unknown
          }

          if (event.type === 'progress') {
            setImportProgress(event.data as ImportProgress)
          } else if (event.type === 'complete') {
            const completeData = event.data as { results: ImportResult }
            setImportResult(completeData.results)
            setImportProgress({
              current: completeData.results.songs.length,
              total: completeData.results.songs.length,
              currentSong: t('spotifyImport.completed'),
              status: 'completed',
            })
          } else if (event.type === 'error') {
            const errorData = event.data as { details?: string; error?: string }
            throw new Error(errorData.details || errorData.error || t('spotifyImport.importFailed'))
          }
        }
      }
    } catch (error) {
      setImportProgress({
        current: 0,
        total: 0,
        currentSong: '',
        status: 'error',
      })
      setPlaylistsError(error instanceof Error ? error.message : t('spotifyImport.importFailed'))
    } finally {
      setImportingPlaylistId(null)
    }
  }

  if (!isConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{t('spotifyImport.notConfigured')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4 sm:py-6">
      <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#011E0B] dark:border-white/[0.08]">
        <div className="relative p-5 sm:p-6">
          <div className="pointer-events-none absolute -bottom-10 -right-6 opacity-90" aria-hidden>
            <Image src="/spotify_logo_V2.png" alt="" width={280} height={314} className="h-36 w-auto rotate-[20deg]" />
          </div>
          <div className="relative z-10 space-y-3">
            <Image
              src="/spotify_text.png"
              alt="Spotify"
              width={637}
              height={287}
              className="h-8 w-[6rem] object-contain object-left mix-blend-screen sm:h-9 sm:w-[7rem]"
            />
            <p className="max-w-md text-sm text-white/80">{t('spotifyImport.description')}</p>
            {!isConnected ? (
              <Button
                type="button"
                onClick={() => handleConnect()}
                className="rounded-full bg-[#1DB954] px-4 text-black hover:bg-[#1ed760]"
              >
                {t('spotifyImport.connect')}
              </Button>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/90">
                <CheckIcon className="h-4 w-4" />
                {t('library.spotifyConnected')}
              </div>
            )}
          </div>
        </div>
      </section>

      {statusMessage && (
        <p
          role="status"
          className={cn(
            'rounded-xl border px-3 py-2 text-sm',
            statusMessage === t('library.spotifyStatus.connected')
              ? 'border-green-600/30 bg-green-500/10 text-green-700 dark:text-green-400'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          )}
        >
          {statusMessage}
        </p>
      )}

      {isConnected && (
        <>
          <div className="rounded-2xl border border-black/[0.06] bg-card p-4 dark:border-white/[0.08] sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">{t('spotifyImport.playlistsTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('spotifyImport.playlistsHint')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {needsReconnect && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleConnect(true)}
                    className="rounded-xl bg-[#1DB954] text-black hover:bg-[#1ed760]"
                  >
                    {t('spotifyImport.reconnect')}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadPlaylists()}
                  disabled={isLoadingPlaylists}
                  className="rounded-xl"
                >
                  <ArrowPathIcon className={cn('mr-1.5 h-4 w-4', isLoadingPlaylists && 'animate-spin')} />
                  {t('spotifyImport.refresh')}
                </Button>
              </div>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="relative sm:col-span-2">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('spotifyImport.searchPlaceholder')}
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-[11px] font-medium text-muted-foreground">
                  {t('spotifyImport.targetFolder')}
                </label>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="">{t('spotifyImport.noFolder')}</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {playlistsError && (
              <p className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {playlistsError}
              </p>
            )}

            {isLoadingPlaylists ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                {t('spotifyImport.loadingPlaylists')}
              </div>
            ) : filteredPlaylists.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('spotifyImport.noPlaylists')}</p>
            ) : (
              <div className="space-y-2">
                {filteredPlaylists.map((playlist) => {
                  const isImporting = importingPlaylistId === playlist.id
                  return (
                    <div
                      key={playlist.id}
                      className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/20 p-3"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                        {playlist.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={playlist.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <MusicalNoteIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{playlist.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {playlist.trackCount} {t('spotifyImport.tracks')}
                          {playlist.ownerName ? ` · ${playlist.ownerName}` : ''}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!!importingPlaylistId}
                        onClick={() => void handleImport(playlist)}
                        className="shrink-0 rounded-xl"
                      >
                        {isImporting ? t('spotifyImport.importing') : t('spotifyImport.import')}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {importProgress && (
            <div className="rounded-2xl border border-black/[0.06] bg-card p-4 dark:border-white/[0.08]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{t('spotifyImport.progressTitle')}</h3>
                {importProgress.status === 'completed' && (
                  <button
                    type="button"
                    onClick={() => {
                      setImportProgress(null)
                      setImportResult(null)
                    }}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                    aria-label={t('common.close')}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{importProgress.currentSong}</p>
              {importProgress.total > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{importProgress.current}/{importProgress.total}</span>
                    <span>{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[#1DB954] transition-all"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {importResult && (
            <div className="rounded-2xl border border-black/[0.06] bg-card p-4 dark:border-white/[0.08]">
              <h3 className="mb-2 text-sm font-semibold text-foreground">{t('spotifyImport.resultsTitle')}</h3>
              <div className="mb-3 flex flex-wrap gap-3 text-sm">
                <span className="text-green-700 dark:text-green-400">
                  {t('spotifyImport.successCount').replace('{count}', String(importResult.success))}
                </span>
                <span className="text-muted-foreground">
                  {t('spotifyImport.duplicateCount').replace('{count}', String(importResult.duplicates))}
                </span>
                <span className="text-destructive">
                  {t('spotifyImport.failedCount').replace('{count}', String(importResult.failed))}
                </span>
              </div>
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {importResult.songs.map((song) => (
                  <div key={`${song.title}-${song.artist}`} className="flex items-start justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-foreground">
                      {song.title} — {song.artist}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 font-medium',
                        song.status === 'success' && 'text-green-600 dark:text-green-400',
                        song.status === 'duplicate' && 'text-muted-foreground',
                        song.status === 'failed' && 'text-destructive'
                      )}
                    >
                      {song.status}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/songs">{t('spotifyImport.viewLibrary')}</Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
