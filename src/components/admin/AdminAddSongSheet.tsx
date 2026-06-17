'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import {
  adminCreateCatalogSongAction,
  adminImportCatalogSongAction,
} from '@/app/(protected)/admin/songs/actions'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { NewSongData } from '@/types'
import type { SearchResult } from '@/lib/services/scraperService'

function isHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text)
}

interface AdminAddSongSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlistId?: string
  onSuccess?: () => void
}

export default function AdminAddSongSheet({
  open,
  onOpenChange,
  playlistId,
  onSuccess,
}: AdminAddSongSheetProps) {
  const { t } = useLanguage()
  const [tab, setTab] = useState<'import' | 'manual'>('import')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [importingUrl, setImportingUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    const trimmed = query.trim()
    if (!trimmed) return
    setIsSearching(true)
    setError(null)
    setResults([])
    try {
      const source = isHebrew(trimmed) ? 'tab4u' : 'ultimate-guitar'
      const response = await fetch(
        `/api/songs/search?q=${encodeURIComponent(trimmed)}&source=${source}`
      )
      const data = await response.json()
      if (data.results?.length) {
        setResults(data.results)
      } else {
        setError(data.error || t('search.noResultsFor').replace('{query}', trimmed))
      }
    } catch {
      setError(t('search.searchError'))
    } finally {
      setIsSearching(false)
    }
  }

  const handleImport = async (result: SearchResult) => {
    setImportingUrl(result.url)
    setError(null)
    try {
      const searchResultParam = encodeURIComponent(JSON.stringify(result))
      const response = await fetch(
        `/api/songs/search?url=${encodeURIComponent(result.url)}&searchResult=${searchResultParam}`
      )
      const data = await response.json()
      if (!response.ok || !data.song?.content) {
        throw new Error(data.error || 'Import failed')
      }
      const scraped = data.song
      await adminImportCatalogSongAction({
        title: scraped.title || result.title,
        author: scraped.author || result.author,
        content: scraped.content,
        sourceUrl: result.url,
        sourceSite: result.source || (isHebrew(result.title) ? 'Tab4U' : 'Ultimate Guitar'),
        tabId: scraped.tabId,
        capo: scraped.capo,
        key: scraped.key,
        rating: scraped.rating ?? result.rating,
        difficulty: scraped.difficulty ?? result.difficulty,
        version: scraped.version ?? result.version,
        versionDescription: scraped.versionDescription ?? result.versionDescription,
        artistUrl: scraped.artistUrl,
        artistImageUrl: scraped.artistImageUrl,
        songImageUrl: scraped.songImageUrl,
        genre: scraped.genre,
        bpm: scraped.bpm,
        playlistId,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setImportingUrl(null)
    }
  }

  const handleManualSuccess = async () => {
    onOpenChange(false)
    onSuccess?.()
  }

  const handleManualSubmit = async (payload: NewSongData) => {
    await adminCreateCatalogSongAction(payload, playlistId)
    await handleManualSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t('admin.addSong')}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex gap-1 rounded-full bg-muted/80 p-0.5">
          <button
            type="button"
            onClick={() => setTab('import')}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${
              tab === 'import' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {t('admin.importTab')}
          </button>
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${
              tab === 'manual' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {t('admin.manualTab')}
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {tab === 'import' ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">{t('admin.searchCatalog')}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
                placeholder={t('common.search')}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
              <Button type="button" onClick={() => void handleSearch()} disabled={isSearching}>
                {isSearching ? t('common.loading') : t('common.search')}
              </Button>
            </div>
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {results.map((result) => (
                <li key={result.url}>
                  <button
                    type="button"
                    disabled={importingUrl === result.url}
                    onClick={() => void handleImport(result)}
                    className="flex w-full flex-col rounded-xl px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                  >
                    <span className="font-medium">{result.title}</span>
                    <span className="text-muted-foreground">{result.author}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4">
            <AdminManualEntry onSubmit={handleManualSubmit} onClose={() => onOpenChange(false)} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function AdminManualEntry({
  onSubmit,
  onClose,
}: {
  onSubmit: (payload: NewSongData) => Promise<void>
  onClose: () => void
}) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({ title: '', author: '', content: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) return
    setIsSaving(true)
    setError(null)
    try {
      await onSubmit({
        title: formData.title.trim(),
        author: formData.author.trim() || t('songs.unknownArtist'),
        content: formData.content.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder={t('songForm.songTitle')}
        className="w-full rounded-xl border border-border px-3 py-2 text-sm"
        required
      />
      <input
        type="text"
        value={formData.author}
        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
        placeholder={t('songForm.artist')}
        className="w-full rounded-xl border border-border px-3 py-2 text-sm"
      />
      <textarea
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        placeholder={t('manualEntry.contentPlaceholder')}
        rows={8}
        className="w-full rounded-xl border border-border px-3 py-2 font-mono text-sm"
        required
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? t('common.saving') : t('common.create')}
        </Button>
      </div>
    </form>
  )
}
