'use client'

import { useLanguage } from '@/context/LanguageContext'
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NewSongData, Folder } from '@/types'
import { addSongAction } from '@/app/(protected)/dashboard/actions'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    content: '',
    folderId: '',
  })
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus()
      if (defaultFolderId) {
        setFormData((prev) => ({ ...prev, folderId: defaultFolderId }))
      }
    }
  }, [isOpen, defaultFolderId])

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
    setFormData({
      title: '',
      author: '',
      content: '',
      folderId: defaultFolderId || '',
    })
    setSearchResults([])
    setShowSearchResults(false)
    setSearchQuery('')
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage({ type: 'error', text: t('search.enterTitleOrArtist') })
      return
    }

    const source = isHebrew(searchQuery) ? 'tab4u' : 'ultimate-guitar'

    setIsSearching(true)
    setSearchResults([])
    setMessage(null)

    try {
      const response = await fetch(`/api/songs/search?q=${encodeURIComponent(searchQuery)}&source=${source}`)
      const data = await response.json()

      if (response.ok && Array.isArray(data.results) && data.results.length > 0) {
        setSearchResults(data.results)
        setShowSearchResults(true)
      } else {
        setMessage({
          type: 'error',
          text: data.error || (data.blocked ? t('search.ugBlocked') : t('search.noResultsFor').replace('{query}', searchQuery)),
        })
      }
    } catch (error) {
      console.error('Error searching:', error)
      setMessage({ type: 'error', text: t('search.searchError') })
    } finally {
      setIsSearching(false)
    }
  }

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
      genre: (scraped as { songGenre?: string; genre?: string }).songGenre || (scraped as { genre?: string }).genre,
      bpm: scraped.bpm,
    } as NewSongData
  }

  const handleFetchFromUrl = async (url: string, searchResult?: SearchResult) => {
    setIsSearching(true)
    setMessage(null)

    try {
      const searchResultParam = searchResult ? encodeURIComponent(JSON.stringify(searchResult)) : ''
      const response = await fetch(`/api/songs/search?url=${encodeURIComponent(url)}&searchResult=${searchResultParam}`)
      const data = await response.json()

      if (response.ok && data.song) {
        const payload = buildNewSongDataFromScrape(data.song, searchResult, formData.folderId || defaultFolderId)
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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col"
      >
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border shrink-0">
          <SheetTitle>{t('songForm.addSong')}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {message && (
            <div
              className={`mb-4 p-3 rounded-xl text-sm border ${
                message.type === 'error'
                  ? 'bg-destructive/10 border-destructive/30 text-destructive'
                  : message.type === 'success'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-muted border-border text-foreground'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{message.text}</span>
                <button type="button" onClick={() => setMessage(null)} className="text-muted-foreground hover:text-foreground">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Online search */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MagnifyingGlassIcon className="h-5 w-5" />
                {t('songForm.searchSongs')}
              </h4>

              <div className="space-y-2">
                <Label htmlFor="add-song-search">{t('songForm.songTitle')} / {t('songForm.artist')}</Label>
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
                  >
                    {isSearching ? t('songForm.loading') : t('songForm.search')}
                  </Button>
                </div>
              </div>

              {showSearchResults && searchResults.length > 0 && (
                <div className="border border-border rounded-xl p-3 max-h-64 overflow-y-auto space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('songForm.searchResults')} ({searchResults.length})
                  </p>
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.url}-${index}`}
                      type="button"
                      disabled={isSearching || isSaving}
                      className="w-full p-3 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
                      onClick={() => handleFetchFromUrl(result.url, result)}
                    >
                      <div className="text-sm font-medium text-foreground">{result.title}</div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-xs text-muted-foreground truncate">{result.author}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {result.rating != null && (
                            <span className="text-xs text-amber-600 dark:text-amber-400">⭐ {result.rating.toFixed(1)}</span>
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

              {!showSearchResults && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl">
                  {t('songForm.clickToLoad')}
                </p>
              )}
            </div>

            {/* Manual entry */}
            <div className="space-y-3 pt-2 border-t border-border">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <PlusIcon className="h-5 w-5" />
                {t('songForm.manualEntry')}
              </h4>

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
                  <Label htmlFor="add-song-content">{t('songForm.chords')} + {t('songForm.lyrics')} *</Label>
                  <textarea
                    id="add-song-content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    required
                    disabled={isSaving}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
            </div>
          </div>
        </div>

        {(isSearching || isSaving) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-sm">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">
                {isSaving ? t('search.addingSong') : t('songForm.loading')}
              </span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
