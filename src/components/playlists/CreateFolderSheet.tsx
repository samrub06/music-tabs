'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import {
  addFolderAction,
  assignSongsToFolderAction,
} from '@/app/(protected)/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FilterChip, FilterChipRow } from '@/components/ui/filter-chip'
import { PlaylistCoverPicker } from '@/components/PlaylistCoverPicker'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Folder } from '@/types'
import {
  FOLDER_SONG_ASSIGN_CHUNK_SIZE,
  MAX_FOLDER_SONGS_ON_CREATE,
} from '@/lib/validation/schemas'
import { resolveAutoCoverSlug } from '@/utils/playlistCover'
import { cn } from '@/lib/utils'

function normalizeFolderName(name: string): string {
  return name.trim().toLowerCase()
}

type SheetStep = 'details' | 'songs'

export type CreateFolderSongOption = {
  id: string
  title: string
  author: string
  genre: string | null
}

interface CreateFolderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingNames: string[]
  songs: CreateFolderSongOption[]
  onCreated?: (folder: Folder) => void
}

/** Bottom sheet to create a personal playlist: name + cover, then pick songs. */
export function CreateFolderSheet({
  open,
  onOpenChange,
  existingNames,
  songs,
  onCreated,
}: CreateFolderSheetProps) {
  const { t } = useLanguage()
  const [step, setStep] = useState<SheetStep>('details')
  const [name, setName] = useState('')
  const [coverSlug, setCoverSlug] = useState<string | null>(null)
  const [coverTouched, setCoverTouched] = useState(false)
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([])
  const [genreFilter, setGenreFilter] = useState<string | null>(null)
  const [songSearch, setSongSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [assignProgress, setAssignProgress] = useState<{
    done: number
    total: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const existingNameSet = useMemo(
    () => new Set(existingNames.map(normalizeFolderName).filter(Boolean)),
    [existingNames]
  )

  const trimmedName = name.trim()
  const isDuplicate =
    trimmedName.length > 0 && existingNameSet.has(normalizeFolderName(trimmedName))

  const genreOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const song of songs) {
      const genre = song.genre?.trim()
      if (!genre) continue
      counts.set(genre, (counts.get(genre) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([genre, count]) => ({ genre, count }))
  }, [songs])

  const filteredSongs = useMemo(() => {
    const query = songSearch.trim().toLowerCase()
    return songs.filter((song) => {
      if (genreFilter && (song.genre?.trim() || '') !== genreFilter) return false
      if (!query) return true
      return (
        song.title.toLowerCase().includes(query) ||
        song.author.toLowerCase().includes(query)
      )
    })
  }, [songs, genreFilter, songSearch])

  const selectedSongSet = useMemo(() => new Set(selectedSongIds), [selectedSongIds])
  const remainingSlots = MAX_FOLDER_SONGS_ON_CREATE - selectedSongIds.length
  const isAtCap = remainingSlots <= 0
  const shownSelectedCount = filteredSongs.filter((song) =>
    selectedSongSet.has(song.id)
  ).length
  const shownUnselectedCount = filteredSongs.length - shownSelectedCount
  const canSelectAllShown = shownUnselectedCount > 0 && remainingSlots > 0

  useEffect(() => {
    if (!open) {
      setStep('details')
      setName('')
      setCoverSlug(null)
      setCoverTouched(false)
      setSelectedSongIds([])
      setGenreFilter(null)
      setSongSearch('')
      setError(null)
      setIsCreating(false)
      setAssignProgress(null)
    }
  }, [open])

  useEffect(() => {
    if (!open || coverTouched) return
    const auto = resolveAutoCoverSlug({ name: trimmedName })
    if (auto) setCoverSlug(auto)
  }, [open, trimmedName, coverTouched])

  const goToSongs = () => {
    if (!trimmedName || isDuplicate) return
    setError(null)
    setStep('songs')
  }

  const toggleSong = (songId: string) => {
    setSelectedSongIds((prev) => {
      if (prev.includes(songId)) {
        return prev.filter((id) => id !== songId)
      }
      if (prev.length >= MAX_FOLDER_SONGS_ON_CREATE) return prev
      return [...prev, songId]
    })
  }

  const selectAllShown = () => {
    setSelectedSongIds((prev) => {
      const next = new Set(prev)
      let slots = MAX_FOLDER_SONGS_ON_CREATE - next.size
      if (slots <= 0) return prev
      for (const song of filteredSongs) {
        if (next.has(song.id)) continue
        next.add(song.id)
        slots -= 1
        if (slots <= 0) break
      }
      return Array.from(next)
    })
  }

  const clearShownSelection = () => {
    const filteredIds = new Set(filteredSongs.map((song) => song.id))
    setSelectedSongIds((prev) => prev.filter((id) => !filteredIds.has(id)))
  }

  const clearAllSelection = () => {
    setSelectedSongIds([])
  }

  const handleCreate = async () => {
    if (!trimmedName || isCreating || isDuplicate) return
    setIsCreating(true)
    setError(null)
    setAssignProgress(null)

    let created: Folder | null = null

    try {
      const idsToAssign = selectedSongIds.slice(0, MAX_FOLDER_SONGS_ON_CREATE)
      created = await addFolderAction(trimmedName, coverSlug ?? undefined)

      if (idsToAssign.length > 0) {
        setAssignProgress({ done: 0, total: idsToAssign.length })
        for (let i = 0; i < idsToAssign.length; i += FOLDER_SONG_ASSIGN_CHUNK_SIZE) {
          const chunk = idsToAssign.slice(i, i + FOLDER_SONG_ASSIGN_CHUNK_SIZE)
          await assignSongsToFolderAction(created.id, chunk)
          setAssignProgress({
            done: Math.min(i + chunk.length, idsToAssign.length),
            total: idsToAssign.length,
          })
        }
      }

      onOpenChange(false)
      onCreated?.(created)
    } catch (err) {
      console.error('Error creating playlist:', err)
      if (created) {
        onOpenChange(false)
        onCreated?.(created)
        return
      }
      const message = err instanceof Error ? err.message : String(err)
      setError(
        message.includes('FOLDER_NAME_EXISTS') || message.toLowerCase().includes('exist')
          ? t('folders.nameExists')
          : t('folders.createError')
      )
      setStep('details')
    } finally {
      setIsCreating(false)
      setAssignProgress(null)
    }
  }

  const assignPercent =
    assignProgress && assignProgress.total > 0
      ? Math.round((assignProgress.done / assignProgress.total) * 100)
      : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="bg-black/35 dark:bg-black/50"
        className="flex h-auto max-h-[min(92vh,720px)] flex-col gap-0 overflow-hidden rounded-t-[1.75rem] border border-b-0 border-black/[0.06] bg-background/95 p-0 shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-background/98 dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)]"
      >
        <div className="flex shrink-0 items-center px-4 py-1.5">
          <div className="flex-1" aria-hidden />
          <div className="h-1 w-14 shrink-0 touch-none rounded-full bg-muted-foreground/25" />
          <div className="flex flex-1 justify-end">
            <SheetClose
              className="flex min-h-[24px] min-w-[24px] items-center justify-center rounded-sm opacity-70"
              disabled={isCreating}
            >
              <XMarkIcon className="h-5 w-5" />
              <span className="sr-only">{t('common.close')}</span>
            </SheetClose>
          </div>
        </div>

        <SheetHeader className="shrink-0 space-y-1 px-5 pb-2 text-start">
          <SheetTitle className="text-xl font-semibold">{t('folders.newFolder')}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {step === 'details'
              ? t('folders.newFolderDescription')
              : t('folders.stepSongsHint')}
          </p>
        </SheetHeader>

        {step === 'details' ? (
          <>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pb-3">
              <div className="space-y-2">
                <Label
                  htmlFor="create-folder-name"
                  className="block text-[11px] font-medium text-muted-foreground"
                >
                  {t('createMenu.folderName')}
                </Label>
                <Input
                  id="create-folder-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('folders.folderNamePlaceholder')}
                  className={cn(
                    'h-11 rounded-xl',
                    isDuplicate && 'border-destructive focus-visible:ring-destructive/30'
                  )}
                  disabled={isCreating}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') goToSongs()
                  }}
                />
                {isDuplicate ? (
                  <p className="text-xs text-destructive">{t('folders.nameExists')}</p>
                ) : null}
                {error ? <p className="text-xs text-destructive">{error}</p> : null}
              </div>

              <PlaylistCoverPicker
                value={coverSlug}
                onChange={(slug) => {
                  setCoverTouched(true)
                  setCoverSlug(slug)
                }}
                disabled={isCreating}
              />
            </div>

            <SheetFooter className="safe-area-inset-bottom flex shrink-0 flex-row gap-3 border-t border-black/[0.06] px-5 py-3 pb-6 dark:border-white/[0.08]">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
                className="h-10 min-h-[44px] flex-1 rounded-xl font-medium"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                onClick={goToSongs}
                disabled={isCreating || !trimmedName || isDuplicate}
                className="h-10 min-h-[44px] flex-1 rounded-xl font-medium"
              >
                {t('common.next')}
              </Button>
            </SheetFooter>
          </>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-5 pb-2">
              <div className="shrink-0 space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {t('folders.songsSelectedCap')
                      .replace('{count}', String(selectedSongIds.length))
                      .replace('{max}', String(MAX_FOLDER_SONGS_ON_CREATE))
                      .replace('{total}', String(songs.length))}
                  </p>
                  {selectedSongIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={clearAllSelection}
                      disabled={isCreating}
                      className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {t('folders.clearAllSelected')}
                    </button>
                  ) : null}
                </div>
                {isAtCap ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400" role="status">
                    {t('folders.selectionCapReached').replace(
                      '{max}',
                      String(MAX_FOLDER_SONGS_ON_CREATE)
                    )}
                  </p>
                ) : null}
              </div>

              {songs.length === 0 ? (
                <p className="rounded-xl bg-muted/50 px-3 py-4 text-sm text-muted-foreground">
                  {t('folders.noSongsToAdd')}
                </p>
              ) : (
                <>
                  <FilterChipRow>
                    <FilterChip
                      active={genreFilter === null}
                      onClick={() => setGenreFilter(null)}
                      className="min-h-[32px] px-3 py-1.5 text-xs"
                    >
                      {t('songs.all')}
                    </FilterChip>
                    {genreOptions.map(({ genre, count }) => (
                      <FilterChip
                        key={genre}
                        active={genreFilter === genre}
                        onClick={() =>
                          setGenreFilter((current) => (current === genre ? null : genre))
                        }
                        className="min-h-[32px] px-3 py-1.5 text-xs"
                      >
                        {genre} ({count})
                      </FilterChip>
                    ))}
                  </FilterChipRow>

                  <div className="relative shrink-0">
                    <MagnifyingGlassIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      value={songSearch}
                      onChange={(e) => setSongSearch(e.target.value)}
                      placeholder={t('folders.searchSongsPlaceholder')}
                      className="h-9 rounded-xl ps-9 pe-10"
                      disabled={isCreating}
                    />
                    {songSearch ? (
                      <button
                        type="button"
                        onClick={() => setSongSearch('')}
                        className="absolute end-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={t('common.clear')}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllShown}
                      disabled={!canSelectAllShown || isCreating}
                      className="h-8 rounded-full text-xs"
                    >
                      {t('folders.selectAllFiltered')}
                      {filteredSongs.length > 0
                        ? ` (${Math.min(shownUnselectedCount, remainingSlots)})`
                        : ''}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearShownSelection}
                      disabled={shownSelectedCount === 0 || isCreating}
                      className="h-8 rounded-full text-xs"
                    >
                      {t('folders.clearFiltered')}
                    </Button>
                  </div>

                  <div
                    className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-black/[0.06] bg-background/60 dark:border-white/[0.08]"
                    role="listbox"
                    aria-multiselectable
                    aria-label={t('folders.stepSongs')}
                  >
                    {filteredSongs.length === 0 ? (
                      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                        {t('folders.noSongsMatchFilter')}
                      </p>
                    ) : (
                      <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                        {filteredSongs.map((song) => {
                          const selected = selectedSongSet.has(song.id)
                          const disabled = isCreating || (!selected && isAtCap)
                          return (
                            <li key={song.id}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={selected}
                                disabled={disabled}
                                onClick={() => toggleSong(song.id)}
                                className={cn(
                                  'flex w-full items-center gap-3 px-3 py-2 text-start transition-colors',
                                  selected
                                    ? 'bg-primary/10'
                                    : 'hover:bg-muted/60 dark:hover:bg-white/[0.04]',
                                  disabled && !selected && 'opacity-50'
                                )}
                              >
                                <span
                                  className={cn(
                                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                                    selected
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-muted-foreground/40 bg-background'
                                  )}
                                  aria-hidden
                                >
                                  {selected ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-foreground">
                                    {song.title}
                                  </span>
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {song.author}
                                    {song.genre ? ` · ${song.genre}` : ''}
                                  </span>
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </>
              )}

              {assignProgress ? (
                <div className="shrink-0 space-y-2" aria-live="polite">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      {t('folders.assigningProgress')
                        .replace('{done}', String(assignProgress.done))
                        .replace('{total}', String(assignProgress.total))}
                    </span>
                    <span className="text-muted-foreground">{assignPercent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                      style={{ width: `${assignPercent}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <SheetFooter className="safe-area-inset-bottom flex shrink-0 flex-row gap-3 border-t border-black/[0.06] px-5 py-3 pb-6 dark:border-white/[0.08]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('details')}
                disabled={isCreating}
                className="h-10 min-h-[44px] flex-1 rounded-xl font-medium"
              >
                {t('common.back')}
              </Button>
              <Button
                type="button"
                onClick={() => void handleCreate()}
                disabled={isCreating || !trimmedName || isDuplicate}
                className="h-10 min-h-[44px] flex-1 rounded-xl font-medium"
              >
                {isCreating
                  ? assignProgress
                    ? t('folders.assigning')
                    : t('common.saving')
                  : selectedSongIds.length > 0
                    ? t('folders.createWithSongs').replace(
                        '{count}',
                        String(selectedSongIds.length)
                      )
                    : t('common.create')}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
