'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import SongTable from '@/components/SongTable'
import Pagination from '@/components/Pagination'
import AdminAddSongSheet from '@/components/admin/AdminAddSongSheet'
import { SelectModeToggleButton } from '@/components/song-table/SongTableHeader'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'
import type { Playlist, Song } from '@/types'
import {
  adminBulkAddSongsToPlaylistAction,
  adminBulkRemoveSongsFromPlaylistAction,
  adminDeleteSongsAction,
} from '@/app/(protected)/admin/songs/actions'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AdminSongsClientProps {
  songs: Song[]
  total: number
  page: number
  limit: number
  artists: string[]
  playlists: Playlist[]
  initialAuthor?: string
  initialPlaylist?: string
  initialQuery?: string
  initialLang?: 'all' | 'he'
}

export default function AdminSongsClient({
  songs,
  total,
  page,
  limit,
  artists,
  playlists,
  initialAuthor = '',
  initialPlaylist = '',
  initialQuery = '',
  initialLang = 'all',
}: AdminSongsClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [localSearch, setLocalSearch] = useState(initialQuery)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [addSheetOpen, setAddSheetOpen] = useState(false)

  const currentPlaylistId = initialPlaylist || null

  const applyParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() || '')
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      if (!updates.page) params.set('page', '1')
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  const hasActiveFilters = Boolean(
    initialAuthor || initialPlaylist || initialQuery || initialLang === 'he'
  )

  const handleSearchSubmit = () => {
    applyParams({ q: localSearch.trim() || undefined, page: '1' })
  }

  const handleClearFilters = () => {
    setLocalSearch('')
    router.push(pathname)
  }

  const handleBulkMoveToPlaylist = async (
    toPlaylistIds: string[],
    songIds: string[],
    removeFromSource: boolean
  ) => {
    for (const toPlaylistId of toPlaylistIds) {
      await adminBulkAddSongsToPlaylistAction(toPlaylistId, songIds)
    }
    if (removeFromSource && currentPlaylistId) {
      await adminBulkRemoveSongsFromPlaylistAction(currentPlaylistId, songIds)
    }
    router.refresh()
  }

  const handleBulkRemoveFromPlaylist = async (songIds: string[]) => {
    if (!currentPlaylistId) return
    await adminBulkRemoveSongsFromPlaylistAction(currentPlaylistId, songIds)
  }

  const handleAddSongToPlaylist = async (songId: string, playlistId: string) => {
    await adminBulkAddSongsToPlaylistAction(playlistId, [songId])
    router.refresh()
  }

  const handleRemoveSongFromPlaylist = async (songId: string, playlistId: string) => {
    await adminBulkRemoveSongsFromPlaylistAction(playlistId, [songId])
    router.refresh()
  }

  const noopFolderChange = async () => {}

  const playlistFilterList = useMemo(() => playlists, [playlists])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">{t('admin.songsTitle')}</h1>
        <Button type="button" size="sm" onClick={() => setAddSheetOpen(true)} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {t('admin.addSong')}
        </Button>
      </div>

      <div className="mb-4 flex shrink-0 flex-col gap-3">
        <div
          className="flex w-full max-w-xs rounded-full bg-muted/80 p-0.5 gap-0.5"
          role="group"
          aria-label={t('admin.filterLanguage')}
        >
          <button
            type="button"
            onClick={() => applyParams({ lang: undefined, page: '1' })}
            className={cn(
              'flex-1 rounded-full py-2 text-sm font-medium transition-all duration-200',
              initialLang !== 'he'
                ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('admin.filterAllSongs')}
          </button>
          <button
            type="button"
            onClick={() => applyParams({ lang: 'he', page: '1' })}
            className={cn(
              'flex-1 rounded-full py-2 text-sm font-medium transition-all duration-200',
              initialLang === 'he'
                ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('admin.filterHebrewSongs')}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              placeholder={t('songs.search')}
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-sm"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleSearchSubmit}>
            {t('common.search')}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={initialAuthor || 'all'}
            onValueChange={(v) =>
              applyParams({ author: v === 'all' ? undefined : v, page: '1' })
            }
          >
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder={t('admin.filterArtist')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.allArtists')}</SelectItem>
              {artists.map((artist) => (
                <SelectItem key={artist} value={artist}>
                  {artist}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={initialPlaylist || 'all'}
            onValueChange={(v) =>
              applyParams({ playlist: v === 'all' ? undefined : v, page: '1' })
            }
          >
            <SelectTrigger className="w-[200px] rounded-xl">
              <SelectValue placeholder={t('admin.filterPlaylist')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.allPlaylists')}</SelectItem>
              {playlists.map((pl) => (
                <SelectItem key={pl.id} value={pl.id}>
                  {pl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters}>
              {t('admin.clearFilters')}
            </Button>
          )}

          <SelectModeToggleButton
            isSelectMode={isSelectMode}
            onToggle={() => setIsSelectMode((v) => !v)}
            t={t}
            className={cn('ml-auto')}
          />
        </div>
      </div>

      <div
        data-main-scroll
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4"
      >
        <SongTable
          songs={songs}
          folders={[]}
          playlists={playlistFilterList}
          currentPlaylistId={currentPlaylistId}
          searchQuery=""
          hasUser
          isSelectMode={isSelectMode}
          onToggleSelectMode={() => setIsSelectMode((v) => !v)}
          onFolderChange={noopFolderChange}
          onDeleteSongs={adminDeleteSongsAction}
          onDeleteAllSongs={async () => {}}
          showPlaylistBulkActions
          playlistsForMove={playlists}
          onBulkMoveToPlaylist={handleBulkMoveToPlaylist}
          onBulkRemoveFromPlaylistAction={
            currentPlaylistId ? handleBulkRemoveFromPlaylist : undefined
          }
          onAddSongToPlaylist={handleAddSongToPlaylist}
          onRemoveSongFromPlaylist={handleRemoveSongFromPlaylist}
        />
        <Pagination page={page} limit={limit} total={total} />
      </div>

      <AdminAddSongSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        playlistId={currentPlaylistId ?? undefined}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
