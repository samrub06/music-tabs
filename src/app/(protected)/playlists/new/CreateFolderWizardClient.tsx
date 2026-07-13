'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { addFolderAction } from '@/app/(protected)/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FilterChip, FilterChipRow } from '@/components/ui/filter-chip'
import { PlaylistCoverPicker } from '@/components/PlaylistCoverPicker'
import {
  getPlaylistCoverOptions,
  resolveAutoCoverSlug,
} from '@/utils/playlistCover'
import { cn } from '@/lib/utils'

type WizardStep = 1 | 2 | 3

export interface WizardSongOption {
  id: string
  title: string
  author: string
  genre: string | null
}

interface CreateFolderWizardClientProps {
  existingNames: string[]
  songs: WizardSongOption[]
}

function normalizeFolderName(name: string): string {
  return name.trim().toLowerCase()
}

export default function CreateFolderWizardClient({
  existingNames,
  songs,
}: CreateFolderWizardClientProps) {
  const { t } = useLanguage()
  const router = useRouter()

  const [step, setStep] = useState<WizardStep>(1)
  const [name, setName] = useState('')
  const [coverSlug, setCoverSlug] = useState<string | null>(null)
  const [coverTouched, setCoverTouched] = useState(false)
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([])
  const [genreFilter, setGenreFilter] = useState<string | null>(null)
  const [songSearch, setSongSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existingNameSet = useMemo(
    () => new Set(existingNames.map(normalizeFolderName).filter(Boolean)),
    [existingNames]
  )

  const trimmedName = name.trim()
  const isDuplicate =
    trimmedName.length > 0 && existingNameSet.has(normalizeFolderName(trimmedName))

  const selectedCover = useMemo(() => {
    if (!coverSlug) return null
    return getPlaylistCoverOptions().find((option) => option.slug === coverSlug) ?? null
  }, [coverSlug])

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

  useEffect(() => {
    if (coverTouched) return
    const auto = resolveAutoCoverSlug({ name })
    if (auto) setCoverSlug(auto)
  }, [name, coverTouched])

  const goNextFromName = () => {
    if (!trimmedName || isDuplicate) return
    setError(null)
    setStep(2)
  }

  const toggleSong = (songId: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    )
  }

  const selectAllFiltered = () => {
    setSelectedSongIds((prev) => {
      const next = new Set(prev)
      for (const song of filteredSongs) next.add(song.id)
      return Array.from(next)
    })
  }

  const clearFilteredSelection = () => {
    const filteredIds = new Set(filteredSongs.map((song) => song.id))
    setSelectedSongIds((prev) => prev.filter((id) => !filteredIds.has(id)))
  }

  const handleCreate = async () => {
    if (!trimmedName || isCreating || isDuplicate) return
    setIsCreating(true)
    setError(null)
    try {
      await addFolderAction(trimmedName, coverSlug ?? undefined, selectedSongIds)
      router.push('/folders')
      router.refresh()
    } catch (err) {
      console.error('Error creating folder:', err)
      const message = err instanceof Error ? err.message : ''
      setError(
        message === 'FOLDER_NAME_EXISTS'
          ? t('folders.nameExists')
          : t('folders.createError')
      )
      setStep(1)
      setIsCreating(false)
    }
  }

  const steps: { id: WizardStep; label: string }[] = [
    { id: 1, label: t('folders.stepName') },
    { id: 2, label: t('folders.stepCover') },
    { id: 3, label: t('folders.stepSongs') },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t('folders.newFolder')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('folders.newFolderWizardDescription')}
          </p>
        </div>

        <div className="flex items-center gap-2" aria-label={t('folders.wizardProgress')}>
          {steps.map((item, index) => {
            const isActive = step === item.id
            const isDone = step > item.id
            return (
              <div key={item.id} className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isActive || isDone
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {item.id}
                </div>
                <span
                  className={cn(
                    'truncate text-xs font-medium sm:text-sm',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'ms-1 hidden h-px flex-1 sm:block',
                      isDone ? 'bg-primary/50' : 'bg-border'
                    )}
                    aria-hidden
                  />
                )}
              </div>
            )
          })}
        </div>

        {step === 1 && (
          <div className="space-y-4 rounded-2xl border border-black/[0.06] bg-white/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.06] sm:p-5">
            <div>
              <Label
                htmlFor="wizard-folder-name"
                className="mb-2.5 block text-[11px] font-medium text-muted-foreground"
              >
                {t('createMenu.folderName')}
              </Label>
              <Input
                id="wizard-folder-name"
                type="text"
                placeholder={t('createMenu.folderNamePlaceholder')}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') goNextFromName()
                }}
                className={cn(
                  'h-11 rounded-xl',
                  (isDuplicate || error) &&
                    'border-destructive focus-visible:ring-destructive/30'
                )}
                autoFocus
                aria-invalid={isDuplicate || Boolean(error)}
              />
              {(isDuplicate || error) && (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {error ?? t('folders.nameExists')}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{t('folders.stepNameHint')}</p>
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/folders')}
                className="h-11 flex-1 rounded-xl"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                onClick={goNextFromName}
                disabled={!trimmedName || isDuplicate}
                className="h-11 flex-1 rounded-xl"
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 rounded-2xl border border-black/[0.06] bg-white/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.06] sm:p-5">
            <p className="text-sm text-muted-foreground">{t('folders.stepCoverHint')}</p>
            {selectedCover && (
              <div className="overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
                <div className="relative aspect-[2/1] w-full bg-muted">
                  {selectedCover.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedCover.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/70 to-primary" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                    <p className="text-sm font-medium text-white">{trimmedName}</p>
                  </div>
                </div>
              </div>
            )}
            <PlaylistCoverPicker
              value={coverSlug}
              onChange={(slug) => {
                setCoverTouched(true)
                setCoverSlug(slug)
              }}
            />
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="h-11 flex-1 rounded-xl"
              >
                {t('common.back')}
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
                disabled={!coverSlug}
                className="h-11 flex-1 rounded-xl"
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 rounded-2xl border border-black/[0.06] bg-white/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.06] sm:p-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('folders.stepSongsHint')}</p>
              <p className="text-sm font-medium text-foreground">
                {t('folders.songsSelected')
                  .replace('{count}', String(selectedSongIds.length))
                  .replace('{total}', String(songs.length))}
              </p>
            </div>

            {songs.length === 0 ? (
              <p className="rounded-xl bg-muted/50 px-3 py-4 text-sm text-muted-foreground">
                {t('folders.noSongsToAdd')}
              </p>
            ) : (
              <>
                <FilterChipRow title={t('folders.filterByStyle')}>
                  <FilterChip
                    active={genreFilter === null}
                    onClick={() => setGenreFilter(null)}
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
                    >
                      {genre} ({count})
                    </FilterChip>
                  ))}
                </FilterChipRow>

                <div className="relative">
                  <MagnifyingGlassIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={songSearch}
                    onChange={(e) => setSongSearch(e.target.value)}
                    placeholder={t('folders.searchSongsPlaceholder')}
                    className="h-11 rounded-xl ps-9 pe-10"
                  />
                  {songSearch ? (
                    <button
                      type="button"
                      onClick={() => setSongSearch('')}
                      className="absolute end-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t('common.clear')}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllFiltered}
                    disabled={filteredSongs.length === 0}
                    className="h-9 rounded-full"
                  >
                    {t('folders.selectAllFiltered')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilteredSelection}
                    disabled={filteredSongs.every((song) => !selectedSongSet.has(song.id))}
                    className="h-9 rounded-full"
                  >
                    {t('folders.clearFiltered')}
                  </Button>
                </div>

                <div className="flex max-h-72 flex-wrap content-start gap-2 overflow-y-auto rounded-xl border border-black/[0.06] bg-background/60 p-3 dark:border-white/[0.08]">
                  {filteredSongs.length === 0 ? (
                    <p className="w-full py-6 text-center text-sm text-muted-foreground">
                      {t('folders.noSongsMatchFilter')}
                    </p>
                  ) : (
                    filteredSongs.map((song) => {
                      const selected = selectedSongSet.has(song.id)
                      return (
                        <button
                          key={song.id}
                          type="button"
                          onClick={() => toggleSong(song.id)}
                          aria-pressed={selected}
                          className={cn(
                            'inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-2 text-start text-sm font-medium transition-all min-h-[36px]',
                            selected
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-muted/80 text-foreground hover:bg-muted dark:bg-white/[0.06] dark:hover:bg-white/10'
                          )}
                        >
                          <span className="truncate">{song.title}</span>
                          {song.author ? (
                            <span
                              className={cn(
                                'truncate text-xs font-normal',
                                selected
                                  ? 'text-primary-foreground/80'
                                  : 'text-muted-foreground'
                              )}
                            >
                              · {song.author}
                            </span>
                          ) : null}
                        </button>
                      )
                    })
                  )}
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                disabled={isCreating}
                className="h-11 flex-1 rounded-xl"
              >
                {t('common.back')}
              </Button>
              <Button
                type="button"
                onClick={() => void handleCreate()}
                disabled={isCreating || !trimmedName || isDuplicate}
                className="h-11 flex-1 rounded-xl"
              >
                {isCreating
                  ? t('createMenu.creating')
                  : selectedSongIds.length > 0
                    ? t('folders.createWithSongs').replace(
                        '{count}',
                        String(selectedSongIds.length)
                      )
                    : t('createMenu.createFolderButton')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
