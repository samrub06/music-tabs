'use client'

import { searchSongsByStyleAction } from '@/app/(protected)/search/actions'
import { addSongAction } from '@/app/(protected)/dashboard/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'
import type { Folder, NewSongData } from '@/types'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AddSongFormProps {
  isOpen: boolean
  onClose: () => void
  folders?: Folder[]
  defaultFolderId?: string
  redirectAfterAdd?: boolean
  onSuccess?: () => void
}

interface SearchResult {
  title: string
  author: string
  url: string
  source: string
  reviews?: number
  rating?: number
  difficulty?: string
  version?: number
  versionDescription?: string
  artistUrl?: string
  artistImageUrl?: string
  songImageUrl?: string
  sourceUrl?: string
  sourceSite?: string
}

type AddSongTab = 'search' | 'ai' | 'manual'

const AI_SUGGESTION_KEYS = [
  'search.aiSuggestion1',
  'search.aiSuggestion2',
  'search.aiSuggestion3',
  'search.aiSuggestion4',
] as const

export default function AddSongForm({
  isOpen,
  onClose,
  folders = [],
  defaultFolderId,
  redirectAfterAdd = true,
  onSuccess,
}: AddSongFormProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AddSongTab>('search')
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    content: '',
    folderId: '',
  })
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [aiQuery, setAiQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const aiTextareaRef = useRef<HTMLTextAreaElement>(null)

  const tabs: { id: AddSongTab; label: string; icon: typeof MagnifyingGlassIcon }[] = [
    { id: 'search', label: t('songForm.tabSearch'), icon: MagnifyingGlassIcon },
    { id: 'ai', label: t('songForm.tabAI'), icon: SparklesIcon },
    { id: 'manual', label: t('songForm.tabManual'), icon: PlusIcon },
  ]

  useEffect(() => {
    if (!isOpen) return
    if (defaultFolderId) {
      setFormData((prev) => ({ ...prev, folderId: defaultFolderId }))
    }
    const focusTimer = window.setTimeout(() => {
      if (activeTab === 'ai') {
        aiTextareaRef.current?.focus({ preventScroll: true })
      } else if (activeTab === 'search') {
        searchInputRef.current?.focus({ preventScroll: true })
      }
    }, 150)
    return () => window.clearTimeout(focusTimer)
  }, [isOpen, defaultFolderId, activeTab])

  useEffect(() => {
    if (!isOpen) return

    const html = document.documentElement
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const scrollContainers = document.querySelectorAll('[data-main-scroll]')
    const previousOverflows = Array.from(scrollContainers).map(
      (el) => (el as HTMLElement).style.overflow
    )
    scrollContainers.forEach((el) => {
      ;(el as HTMLElement).style.overflow = 'hidden'
    })

    return () => {
      html.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
      scrollContainers.forEach((el, index) => {
        ;(el as HTMLElement).style.overflow = previousOverflows[index] ?? ''
      })
    }
  }, [isOpen])

  function normalizeNewSongData(d: NewSongData): NewSongData {
    return {
      ...d,
      title: d.title.trim(),
      author: (d.author || '').trim(),
      content: d.content.trim(),
      folderId: d.folderId || undefined,
    }
  }

  const handleReset = () => {
    setActiveTab('search')
    setFormData({
      title: '',
      author: '',
      content: '',
      folderId: defaultFolderId || '',
    })
    setSearchResults([])
    setShowSearchResults(false)
    setSearchQuery('')
    setAiQuery('')
    setMessage(null)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const saveNewSong = async (payload: NewSongData, opts?: { redirect?: boolean }) => {
    setIsSaving(true)
    setMessage(null)
    try {
      const newSong = await addSongAction(normalizeNewSongData(payload))
      const shouldRedirect = opts?.redirect ?? redirectAfterAdd
      if (shouldRedirect) {
        router.push(`/song/${newSong.id}`)
      }
      onSuccess?.()
      handleReset()
      onClose()
    } catch (error) {
      console.error('Error adding song:', error)
      const errorMessage = error instanceof Error ? error.message : t('search.addError')
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.content.trim()) {
      setMessage({ type: 'error', text: t('songForm.titleRequired') })
      return
    }

    await saveNewSong({
      title: formData.title,
      author: formData.author,
      content: formData.content,
      folderId: formData.folderId,
    })
  }

  const isHebrew = (text: string) => /[\u0590-\u05FF]/.test(text)

  function buildNewSongDataFromScrape(
    scraped: Partial<NewSongData> & { url?: string; source?: string; songImageUrl?: string },
    result?: SearchResult,
    folderId?: string
  ): NewSongData {
    return {
      title: (scraped.title || result?.title || t('songs.unknownTitle')).trim(),
      author: (scraped.author || result?.author || t('songs.unknownArtist')).trim(),
      content: (scraped as { content?: string }).content || '',
      folderId: folderId || undefined,
      reviews: (result?.reviews ?? scraped.reviews) || 0,
      capo: scraped.capo,
      key: scraped.key,
      rating: scraped.rating,
      difficulty: scraped.difficulty,
      version: scraped.version,
      versionDescription: scraped.versionDescription,
      artistUrl: scraped.artistUrl,
      artistImageUrl: scraped.artistImageUrl,
      songImageUrl: scraped.songImageUrl,
      sourceUrl: scraped.url,
      sourceSite: scraped.source,
      tabId: scraped.tabId,
      genre:
        (scraped as { songGenre?: string; genre?: string }).songGenre ||
        (scraped as { genre?: string }).genre,
      bpm: scraped.bpm,
    } as NewSongData
  }

  const handleFetchFromUrl = async (url: string, searchResult?: SearchResult) => {
    setIsSearching(true)
    setMessage(null)

    try {
      const searchResultParam = searchResult
        ? encodeURIComponent(JSON.stringify(searchResult))
        : ''
      const response = await fetch(
        `/api/songs/search?url=${encodeURIComponent(url)}&searchResult=${searchResultParam}`
      )
      const data = await response.json()

      if (response.ok && data.song) {
        const payload = buildNewSongDataFromScrape(
          data.song,
          searchResult,
          formData.folderId || defaultFolderId
        )
        if (!payload.title.trim() || !payload.content.trim()) {
          setMessage({ type: 'error', text: t('errors.invalidSongData') })
          return
        }
        await saveNewSong(payload)
      } else {
        setMessage({ type: 'error', text: data.error || t('errors.retrieveError') })
      }
    } catch (error) {
      console.error('Error fetching song:', error)
      setMessage({ type: 'error', text: t('errors.retrieveErrorRetry') })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage({ type: 'error', text: t('search.enterTitleOrArtist') })
      return
    }

    const source = isHebrew(searchQuery) ? 'tab4u' : 'ultimate-guitar'

    setIsSearching(true)
    setSearchResults([])
    setShowSearchResults(false)
    setMessage(null)

    try {
      const response = await fetch(
        `/api/songs/search?q=${encodeURIComponent(searchQuery)}&source=${source}`
      )
      const data = await response.json()

      if (response.ok && Array.isArray(data.results) && data.results.length > 0) {
        setSearchResults(data.results)
        setShowSearchResults(true)
      } else {
        setMessage({
          type: 'error',
          text:
            data.error ||
            (data.blocked
              ? t('search.ugBlocked')
              : t('search.noResultsFor').replace('{query}', searchQuery)),
        })
      }
    } catch (error) {
      console.error('Error searching:', error)
      setMessage({ type: 'error', text: t('search.searchError') })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAISearch = async (queryOverride?: string) => {
    const query = (queryOverride ?? aiQuery).trim()
    if (!query) {
      setMessage({ type: 'error', text: t('search.enterTitleOrArtist') })
      return
    }

    setIsSearching(true)
    setSearchResults([])
    setShowSearchResults(false)
    setMessage(null)

    try {
      const aiResult = await searchSongsByStyleAction(query)

      if (!aiResult.success || aiResult.songs.length === 0) {
        setMessage({
          type: 'error',
          text: aiResult.error || t('search.noSongsForStyle'),
        })
        return
      }

      const allResults: SearchResult[] = []
      for (const aiSong of aiResult.songs) {
        const q = `${aiSong.title} ${aiSong.artist}`
        const response = await fetch(
          `/api/songs/search?q=${encodeURIComponent(q)}&source=${aiSong.source}`
        )
        const data = await response.json()
        if (response.ok && data.results?.length > 0) {
          allResults.push(...data.results)
        }
      }

      if (allResults.length > 0) {
        setSearchResults(allResults)
        setShowSearchResults(true)
      } else {
        setMessage({ type: 'error', text: t('search.noResultsForAISuggestions') })
      }
    } catch (error) {
      console.error('Error AI search:', error)
      setMessage({ type: 'error', text: t('search.searchError') })
    } finally {
      setIsSearching(false)
    }
  }

  const renderSearchResults = () => (
    <>
      {isSearching && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-muted/40 px-3 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">{t('songForm.loading')}</span>
        </div>
      )}

      {!isSearching && showSearchResults && searchResults.length > 0 && (
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl bg-muted/30 p-2 sm:max-h-64">
          <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">
            {t('songForm.searchResults')} ({searchResults.length})
          </p>
          {searchResults.map((result, index) => (
            <button
              key={`${result.url}-${index}`}
              type="button"
              disabled={isSearching || isSaving}
              className="w-full rounded-lg p-3 text-left transition-colors hover:bg-muted/60 disabled:opacity-50"
              onClick={() => handleFetchFromUrl(result.url, result)}
            >
              <div className="text-sm font-medium text-foreground">{result.title}</div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-xs text-muted-foreground">{result.author}</span>
                <div className="flex shrink-0 items-center gap-1">
                  {result.rating != null && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      ⭐ {result.rating.toFixed(1)}
                    </span>
                  )}
                  {result.difficulty && (
                    <span className="text-xs text-muted-foreground">{result.difficulty}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          'z-[100] flex flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-background p-0 shadow-lg',
          'max-lg:fixed max-lg:inset-x-4 max-lg:top-[max(0.75rem,env(safe-area-inset-top,0px))]',
          'max-lg:bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] max-lg:left-4 max-lg:right-4',
          'max-lg:h-auto max-lg:w-auto max-lg:max-h-none max-lg:max-w-none',
          'max-lg:translate-x-0 max-lg:translate-y-0',
          'sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:right-auto sm:inset-x-auto',
          'sm:h-auto sm:w-[calc(100%-2rem)] sm:max-w-xl sm:max-h-[min(88dvh,680px)]',
          'sm:translate-x-[-50%] sm:translate-y-[-50%]'
        )}
      >
        <DialogHeader className="shrink-0 px-4 pb-2 pt-4 pr-12 text-left">
          <DialogTitle>{t('songForm.addSong')}</DialogTitle>
        </DialogHeader>

        <div className="shrink-0 px-4 pb-3">
          <div className="flex gap-1 rounded-full bg-muted/80 p-0.5">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveTab(id)
                  setMessage(null)
                }}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-xs font-medium transition-all duration-200 sm:px-3 sm:text-sm',
                  activeTab === id
                    ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                    : 'text-muted-foreground hover:text-foreground',
                  id === 'ai' && activeTab === id && 'text-purple-700 dark:text-purple-400'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    id === 'ai' && (activeTab === id ? 'text-purple-600 dark:text-purple-400' : 'text-purple-500/80')
                  )}
                />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 pb-6">
          {message && (
            <div
              className={cn(
                'mb-4 rounded-xl p-3 text-sm',
                message.type === 'error'
                  ? 'bg-destructive/10 text-destructive'
                  : message.type === 'success'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-foreground'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{message.text}</span>
                <button
                  type="button"
                  onClick={() => setMessage(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  id="add-song-search"
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('songForm.searchPlaceholder')}
                  disabled={isSearching || isSaving}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching || isSaving || !searchQuery.trim()}
                  className="min-w-[5.5rem]"
                >
                  {isSearching ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span className="sr-only sm:not-sr-only sm:inline">
                        {t('songForm.loading')}
                      </span>
                    </span>
                  ) : (
                    t('songForm.search')
                  )}
                </Button>
              </div>
              {renderSearchResults()}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{t('songForm.aiHint')}</p>
              <Label htmlFor="add-song-ai">{t('search.aiPlaceholder')}</Label>
              <textarea
                id="add-song-ai"
                ref={aiTextareaRef}
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAISearch()
                  }
                }}
                rows={4}
                placeholder={t('search.aiPlaceholder')}
                disabled={isSearching || isSaving}
                className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('search.aiSuggestions')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {AI_SUGGESTION_KEYS.map((key) => {
                    const suggestion = t(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setAiQuery(suggestion)
                          handleAISearch(suggestion)
                        }}
                        disabled={isSearching || isSaving}
                        className="rounded-full bg-muted/80 px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-primary/15 hover:text-primary disabled:opacity-50 sm:text-sm"
                      >
                        {suggestion}
                      </button>
                    )
                  })}
                </div>
              </div>
              <Button
                type="button"
                onClick={() => handleAISearch()}
                disabled={isSearching || isSaving || !aiQuery.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('songForm.loading')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4" />
                    {t('search.askWithAI')}
                  </span>
                )}
              </Button>
              {renderSearchResults()}
            </div>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-song-title">{t('songForm.songTitle')} *</Label>
                <Input
                  id="add-song-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-song-artist">{t('songForm.artist')}</Label>
                <Input
                  id="add-song-artist"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('songs.folder')}</Label>
                <Select
                  value={formData.folderId || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, folderId: value === 'none' ? '' : value })
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('songs.unorganized')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('songs.unorganized')}</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-song-content">
                  {t('songForm.chords')} + {t('songForm.lyrics')} *
                </Label>
                <textarea
                  id="add-song-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  required
                  disabled={isSaving}
                  className="flex max-h-32 w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:max-h-40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
                  {t('songForm.cancel')}
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t('songForm.loading') : t('songForm.addSong')}
                </Button>
              </div>
            </form>
          )}
        </div>

        {isSaving && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl bg-background px-4 py-3 shadow-sm">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">{t('search.addingSong')}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
