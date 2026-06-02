'use client'

import { useHideHeaderOnScroll } from '@/lib/hooks/useHideHeaderOnScroll'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlassIcon, XMarkIcon, PlusIcon, PlayIcon, SparklesIcon, MusicalNoteIcon } from '@heroicons/react/24/outline'
import { searchSongsByStyleAction } from './actions'
import { useLanguage } from '@/context/LanguageContext'
import { addSongAction } from '@/app/(protected)/dashboard/actions'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { songRepo } from '@/lib/services/songRepo'
import type { NewSongData } from '@/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RecentSearchList } from '@/components/search/RecentSearchList'
import {
  FALLBACK_SEARCH_IMAGE_URL,
  loadRecentSearches,
  RECENT_SEARCHES_PREVIEW,
  upsertRecentSearch,
  type RecentSearchItem,
} from '@/lib/recentSearches'

import type { Song } from '@/types'
import type { ReactNode } from 'react'

interface SearchClientProps {
  userId?: string
  children?: ReactNode
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
  tabId?: string
}

const AI_SUGGESTION_KEYS = [
  'search.aiSuggestion1',
  'search.aiSuggestion2',
  'search.aiSuggestion3',
  'search.aiSuggestion4',
] as const

export default function SearchClient({
  userId,
  children
}: SearchClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const { supabase } = useSupabase()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const aiTextareaRef = useRef<HTMLTextAreaElement>(null)
  useHideHeaderOnScroll(scrollContainerRef, true)
  const initialQueryApplied = useRef(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [existingSongs, setExistingSongs] = useState<Map<number, string>>(new Map()) // resultIndex -> songId
  const [isSearching, setIsSearching] = useState(false)
  const [isCheckingExisting, setIsCheckingExisting] = useState(false)
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([])
  const [addingSongId, setAddingSongId] = useState<string | null>(null)
  const [viewingSongId, setViewingSongId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isAIMode, setIsAIMode] = useState(false)

  useEffect(() => {
    setRecentSearches(loadRecentSearches())
  }, [])

  useEffect(() => {
    if (isAIMode) {
      aiTextareaRef.current?.focus()
    } else {
      searchInputRef.current?.focus()
    }
  }, [isAIMode])

  const saveToRecentSearches = (query: string, previewResult?: SearchResult) => {
    const updated = upsertRecentSearch(query, previewResult)
    setRecentSearches(updated)
  }

  // Check if Hebrew text
  const isHebrew = (text: string) => {
    const hebrewRegex = /[\u0590-\u05FF]/
    return hebrewRegex.test(text)
  }

  // Check if search results exist in user's songs
  const checkExistingSongs = useCallback(async (results: SearchResult[]) => {
    if (!supabase || !userId || results.length === 0) {
      setExistingSongs(new Map())
      return
    }

    setIsCheckingExisting(true)
    try {
      const repo = songRepo(supabase)
      const userSongs = await repo.getAllSongsLightweight()
      
      const existingMap = new Map<number, string>()
      
      results.forEach((result, index) => {
        // Try to match by tabId first (most reliable)
        if (result.tabId) {
          const match = userSongs.find(song => song.tabId === result.tabId)
          if (match) {
            existingMap.set(index, match.id)
            return
          }
        }
        
        // Try to match by sourceUrl
        if (result.url || result.sourceUrl) {
          const url = result.url || result.sourceUrl
          const match = userSongs.find(song => song.sourceUrl === url)
          if (match) {
            existingMap.set(index, match.id)
            return
          }
        }
        
        // Fallback: match by title + author (case-insensitive)
        const titleMatch = result.title.toLowerCase().trim()
        const authorMatch = result.author.toLowerCase().trim()
        const match = userSongs.find(song => 
          song.title.toLowerCase().trim() === titleMatch &&
          song.author.toLowerCase().trim() === authorMatch
        )
        if (match) {
          existingMap.set(index, match.id)
        }
      })
      
      setExistingSongs(existingMap)
    } catch (error) {
      console.error('Error checking existing songs:', error)
    } finally {
      setIsCheckingExisting(false)
    }
  }, [supabase, userId])

  // Perform external search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setExistingSongs(new Map())
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setMessage(null)
    setHasSearched(true) // Mark that a search was performed
    
    try {
      if (isAIMode) {
        // AI Mode: Get style-based suggestions, then search for each
        const aiResult = await searchSongsByStyleAction(query.trim())
        
        if (!aiResult.success || aiResult.songs.length === 0) {
          setMessage({ type: 'error', text: aiResult.error || t('search.noSongsForStyle') })
          setSearchResults([])
          setExistingSongs(new Map())
          setIsSearching(false)
          return
        }

        // Search for each AI suggestion on the appropriate source
        const allResults: SearchResult[] = []
        for (const aiSong of aiResult.songs) {
          const searchQuery = `${aiSong.title} ${aiSong.artist}`
          const response = await fetch(`/api/songs/search?q=${encodeURIComponent(searchQuery)}&source=${aiSong.source}`)
          const data = await response.json()
          
          if (response.ok && data.results && data.results.length > 0) {
            allResults.push(...data.results)
          }
        }

        if (allResults.length > 0) {
          setSearchResults(allResults)
          saveToRecentSearches(query.trim(), allResults[0])
          await checkExistingSongs(allResults)
        } else {
          setMessage({ type: 'error', text: t('search.noResultsForAISuggestions') })
          setSearchResults([])
          setExistingSongs(new Map())
        }
      } else {
        // Normal search (existing logic)
        const isHebrewText = isHebrew(query)
        const source = isHebrewText ? 'tab4u' : 'ultimate-guitar'
        
        const response = await fetch(`/api/songs/search?q=${encodeURIComponent(query.trim())}&source=${source}`)
        const data = await response.json()

        if (response.ok && Array.isArray(data.results) && data.results.length > 0) {
          setSearchResults(data.results)
          saveToRecentSearches(query.trim(), data.results[0])
          // Check if results exist in user's songs
          await checkExistingSongs(data.results)
        } else {
          const errorMsg =
            data.error ||
            (data.debug?.proxyConfigured && data.blocked
              ? t('search.ugProxyBlocked')
              : data.blocked
                ? t('search.ugBlocked')
                : t('search.noResultsFor').replace('{query}', query))
          setMessage({ type: 'error', text: errorMsg })
          setSearchResults([])
          setExistingSongs(new Map())
        }
      }
    } catch (error) {
      console.error('Error searching songs:', error)
      const errorMsg = t('search.searchError')
      setMessage({ type: 'error', text: errorMsg })
      setSearchResults([])
      setExistingSongs(new Map())
    } finally {
      setIsSearching(false)
    }
  }, [isAIMode, checkExistingSongs, t])

  useEffect(() => {
    const q = searchParams.get('q')?.trim()
    if (!q || initialQueryApplied.current) return
    initialQueryApplied.current = true
    setSearchQuery(q)
    performSearch(q)
  }, [searchParams, performSearch])

  // Handle search input change — reset search session when cleared so recents & library show again
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (!value.trim()) {
      setSearchResults([])
      setExistingSongs(new Map())
      setHasSearched(false)
      setMessage(null)
    }
  }

  const handleSubmitSearch = () => {
    const q = searchQuery.trim()
    if (!q || isSearching) return
    performSearch(q)
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (!isAIMode || !e.shiftKey)) {
      e.preventDefault()
      if (searchQuery.trim()) {
        performSearch(searchQuery)
      }
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    performSearch(suggestion)
  }

  // Handle recent search click
  const handleRecentSearchClick = (item: RecentSearchItem) => {
    setSearchQuery(item.query)
    performSearch(item.query)
  }

  // Handle clear search - Reset all search state
  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setExistingSongs(new Map())
    setMessage(null)
    setHasSearched(false)
    setAddingSongId(null)
  }

  // Build NewSongData from scraped data
  const buildNewSongDataFromScrape = (
    scraped: any,
    result?: SearchResult
  ): NewSongData => {
    return {
      title: (scraped.title || result?.title || 'Unknown title').trim(),
      author: (scraped.author || result?.author || 'Unknown artist').trim(),
      content: scraped.content || '',
      reviews: (result?.reviews ?? scraped.reviews) || 0,
      capo: scraped.capo,
      key: scraped.key,
      rating: scraped.rating || result?.rating,
      difficulty: scraped.difficulty || result?.difficulty,
      version: scraped.version || result?.version,
      versionDescription: scraped.versionDescription || result?.versionDescription,
      artistUrl: scraped.artistUrl || result?.artistUrl,
      artistImageUrl: scraped.artistImageUrl || result?.artistImageUrl,
      songImageUrl: scraped.songImageUrl || result?.songImageUrl,
      sourceUrl: scraped.url || result?.url || result?.sourceUrl,
      sourceSite: scraped.source || result?.source,
      tabId: scraped.tabId || result?.tabId,
      genre: scraped.genre || scraped.songGenre,
      bpm: scraped.bpm
    } as NewSongData
  }

  // Handle view song (without adding)
  const handleViewSong = async (result: SearchResult) => {
    setViewingSongId(result.url)
    setMessage(null)
    
    try {
      // Navigate to preview page with URL
      const url = encodeURIComponent(result.url)
      const searchResultParam = encodeURIComponent(JSON.stringify(result))
      router.push(`/song/preview?url=${url}&searchResult=${searchResultParam}`)
    } catch (error) {
      console.error('Error viewing song:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error viewing song'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setViewingSongId(null)
    }
  }

  // Handle add song
  const handleAddSong = async (result: SearchResult, index: number) => {
    if (!userId) {
      router.push('/login?next=/search')
      return
    }

    setAddingSongId(result.url)
    setMessage(null)
    
    try {
      // Fetch song from URL
      const searchResultParam = encodeURIComponent(JSON.stringify(result))
      const response = await fetch(`/api/songs/search?url=${encodeURIComponent(result.url)}&searchResult=${searchResultParam}`)
      const data = await response.json()

      if (response.ok && data.song) {
        // Build payload and add song
        const payload = buildNewSongDataFromScrape(data.song, result)
        
        if (!payload.title.trim() || !payload.content.trim()) {
          setMessage({ type: 'error', text: 'Données de chanson invalides.' })
          return
        }

        const normalizedPayload: NewSongData = {
          ...payload,
          title: payload.title.trim(),
          author: (payload.author || '').trim(),
          content: payload.content.trim(),
        }

        const newSong = await addSongAction(normalizedPayload)
        setMessage({ type: 'success', text: t('search.addSuccess') })
        
        // Update existing songs map
        setExistingSongs(prev => {
          const updated = new Map(prev)
          updated.set(index, newSong.id)
          return updated
        })
        
        // Refresh after a short delay
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        setMessage({ type: 'error', text: data.error || t('search.addError') })
      }
    } catch (error) {
      console.error('Error adding song:', error)
      const errorMessage = error instanceof Error ? error.message : t('search.addError')
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setAddingSongId(null)
    }
  }

  const queryTrimmed = searchQuery.trim()
  const hasSearchResults = queryTrimmed.length > 0 && searchResults.length > 0
  const showSearchResultsPanel =
    isSearching || hasSearchResults || (hasSearched && queryTrimmed.length > 0)
  const showLibrarySections =
    !queryTrimmed && searchResults.length === 0 && !hasSearched && !isSearching
  const showRecentSearches =
    !isAIMode &&
    !queryTrimmed &&
    searchResults.length === 0 &&
    !isSearching &&
    !hasSearched &&
    recentSearches.length > 0
  const showAISuggestions = isAIMode && !searchQuery.trim() && !isSearching && !hasSearchResults

  return (
    <div
      ref={scrollContainerRef}
      data-main-scroll
      className={cn(
        'flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-background',
        'p-4 pt-4 sm:p-6 sm:pt-6 lg:px-0 lg:py-8 lg:min-h-screen'
      )}
    >
      <div className="max-w-7xl mx-auto lg:max-w-none lg:mx-0 pb-24 lg:pb-10">
        <div className="mb-6">
          <div
            className={cn(
              'relative rounded-xl border bg-card transition-all duration-300 ease-in-out',
              isAIMode
                ? 'min-h-[8.5rem] border-primary/40 ring-2 ring-primary/15 shadow-sm'
                : 'min-h-[3.5rem] border-border focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary'
            )}
          >
            {isAIMode && (
              <div className="pointer-events-none absolute left-0 top-4 pl-4 text-primary transition-all duration-300">
                <SparklesIcon className="h-5 w-5" />
              </div>
            )}

            {isAIMode ? (
              <textarea
                ref={aiTextareaRef}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('search.aiPlaceholder')}
                rows={3}
                className={cn(
                  'block w-full min-h-[8.5rem] pl-12 pt-4 pb-3 border-0 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-base leading-relaxed resize-none transition-all duration-300',
                  searchQuery ? 'pr-44 sm:pr-52' : 'pr-40 sm:pr-48'
                )}
              />
            ) : (
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('search.searchPlaceholder')}
                className={cn(
                  'block h-14 w-full border-0 bg-transparent py-4 pl-4 text-base leading-5 text-foreground transition-all duration-300 placeholder:text-muted-foreground focus:outline-none',
                  searchQuery ? 'pr-48 sm:pr-56' : 'pr-44 sm:pr-52'
                )}
              />
            )}

            <div
              className={cn(
                'absolute right-0 flex items-center gap-1 pr-2 sm:pr-3',
                isAIMode ? 'top-3' : 'inset-y-0'
              )}
            >
              {!isAIMode && (
                <button
                  type="button"
                  onClick={handleSubmitSearch}
                  disabled={!queryTrimmed || isSearching}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-40"
                  aria-label={t('common.search')}
                >
                  {isSearching ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  )}
                </button>
              )}
              {isAIMode && (
                <button
                  type="button"
                  onClick={handleSubmitSearch}
                  disabled={!queryTrimmed || isSearching}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-40"
                  aria-label={t('search.askWithAI')}
                >
                  {isSearching ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <SparklesIcon className="h-5 w-5" />
                  )}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setIsAIMode((prev) => !prev)
                }}
                className={cn(
                  'flex min-h-[40px] items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors shrink-0',
                  isAIMode
                    ? 'text-primary hover:bg-primary/10'
                    : 'text-purple-600 hover:bg-purple-500/10 dark:text-purple-400'
                )}
                aria-label={
                  isAIMode ? t('search.backToNormalSearch') : t('search.enableAIStyleSearch')
                }
                aria-pressed={isAIMode}
                type="button"
              >
                {isAIMode ? (
                  <>
                    <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-xs font-medium whitespace-nowrap text-primary">
                      {t('search.backToNormalSearch')}
                    </span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium whitespace-nowrap text-purple-600 dark:text-purple-400">
                      {t('search.askWithAI')}
                    </span>
                  </>
                )}
              </button>
              {searchQuery && !isSearching && (
                <button
                  onClick={handleClearSearch}
                  className="flex items-center text-muted-foreground hover:text-foreground p-1"
                  type="button"
                  aria-label={t('common.clear')}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {showAISuggestions && (
            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
              <p className="text-xs font-medium text-muted-foreground">{t('search.aiSuggestions')}</p>
              <div className="flex flex-wrap gap-2">
                {AI_SUGGESTION_KEYS.map((key) => {
                  const suggestion = t(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 text-xs sm:text-sm rounded-full border border-border bg-card text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors text-left"
                    >
                      {suggestion}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Recent searches — below search bar with vignettes */}
        {showRecentSearches && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-2 min-w-0">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t('search.recentSearches')}
              </h2>
              <Link
                href="/search/recent"
                className="text-xs font-medium text-primary hover:text-primary/80 shrink-0"
                onMouseDown={(e) => e.preventDefault()}
              >
                {t('search.viewAllRecent')}
              </Link>
            </div>
            <RecentSearchList
              compact
              items={recentSearches.slice(0, RECENT_SEARCHES_PREVIEW)}
              onItemClick={handleRecentSearchClick}
            />
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-xl border ${
            message.type === 'error' 
              ? 'bg-destructive/10 border-destructive/30 text-destructive' 
              : 'bg-primary/10 border-primary/30 text-primary'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="text-muted-foreground hover:text-foreground shrink-0 p-1 rounded-md"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {showSearchResultsPanel && (
          <div className="mb-6 rounded-xl border border-border bg-card/40">
            {isSearching ? (
              <div className="flex items-center justify-center gap-3 px-4 py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">{t('search.searching')}</p>
              </div>
            ) : hasSearchResults ? (
          <>
            <div className="flex items-center gap-2.5 border-b border-border px-3 py-2.5 sm:px-4 w-fit min-h-[2rem] overflow-visible">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                <MusicalNoteIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-wrap items-center gap-2 gap-y-0 min-w-0 overflow-visible">
                <h2 className="text-base sm:text-lg font-semibold text-foreground whitespace-nowrap leading-tight">
                  {t('search.songsFound')}
                </h2>
                <span
                  className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-2 rounded-full text-xs font-medium bg-muted text-muted-foreground flex-shrink-0"
                  aria-label={`${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''}`}
                >
                  {searchResults.length}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 p-2 sm:p-3">
              {searchResults.map((result, index) => {
                const existingSongId = existingSongs.get(index)
                const imageUrl = result.songImageUrl || result.artistImageUrl || FALLBACK_SEARCH_IMAGE_URL
                const isTab4U = result.source === 'Tab4U' || result.sourceSite === 'Tab4U'
                const isViewing = viewingSongId === result.url
                const isAdding = addingSongId === result.url

                const hasMeta = (!isTab4U && (result.rating != null || result.reviews != null)) || result.difficulty

                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 sm:gap-3 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-card border border-border/80 hover:border-border hover:bg-muted/30 transition-all cursor-pointer"
                    onClick={() => {
                      if (existingSongId) {
                        router.push(`/song/${existingSongId}`)
                      } else {
                        handleViewSong(result)
                      }
                    }}
                  >
                    {/* Photo compacte */}
                    <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-md overflow-hidden bg-muted">
                      <img
                        src={imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Titre et auteur visibles sur 2 lignes max, étoiles en dessous */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0">
                      <div className="min-w-0">
                        <h3
                          className="text-sm font-semibold text-foreground line-clamp-2 break-words"
                          title={result.title}
                        >
                          {result.title}
                        </h3>
                        <p
                          className="text-xs text-muted-foreground truncate mt-0.5"
                          title={result.author}
                        >
                          {result.author}
                        </p>
                      </div>
                      {hasMeta && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] sm:text-xs text-muted-foreground">
                          {!isTab4U && result.rating != null && (
                            <span>⭐ {Number(result.rating).toFixed(1)}</span>
                          )}
                          {!isTab4U && result.reviews != null && (
                            <span>💬 {result.reviews}</span>
                          )}
                          {result.difficulty && (
                            <span>🎸 {result.difficulty}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions icône compactes */}
                    <div className="flex-shrink-0 flex items-center gap-1 border-l border-border/60 pl-2 sm:pl-2.5" onClick={(e) => e.stopPropagation()}>
                      {existingSongId ? (
                        <Button asChild size="icon" className="rounded-lg h-8 w-8" aria-label={t('search.viewSong')}>
                          <Link href={`/song/${existingSongId}`}>
                            <PlayIcon className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="default"
                            className="rounded-lg h-8 w-8"
                            onClick={() => handleViewSong(result)}
                            disabled={isViewing}
                            aria-label={t('search.viewSong')}
                            title={t('search.viewSong')}
                          >
                            {isViewing ? (
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
                            ) : (
                              <PlayIcon className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="rounded-lg h-8 w-8"
                            onClick={() => handleAddSong(result, index)}
                            disabled={isAdding || !userId}
                            aria-label={t('common.create')}
                            title={t('common.create')}
                          >
                            {isAdding ? (
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
                            ) : (
                              <PlusIcon className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
            ) : hasSearched && queryTrimmed && !message ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('search.noResultsFor').replace('{query}', queryTrimmed)}
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Library sections — always mounted, hidden via CSS to avoid RSC reload flash */}
        <div className={cn(!showLibrarySections && 'hidden')}>
          {children}
        </div>
      </div>
    </div>
  )
}
