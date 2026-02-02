'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon, PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { addSongAction } from '@/app/(protected)/dashboard/actions'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { songRepo } from '@/lib/services/songRepo'
import type { NewSongData } from '@/types'
import Link from 'next/link'

import type { Song } from '@/types'
import type { ReactNode } from 'react'
import Image from 'next/image'

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

const RECENT_SEARCHES_KEY = 'recentSearches'
const MAX_RECENT_SEARCHES = 10

export default function SearchClient({
  userId,
  children
}: SearchClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const { supabase } = useSupabase()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [existingSongs, setExistingSongs] = useState<Map<number, string>>(new Map()) // resultIndex -> songId
  const [isSearching, setIsSearching] = useState(false)
  const [isCheckingExisting, setIsCheckingExisting] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [addingSongId, setAddingSongId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [hasSearched, setHasSearched] = useState(false) // Track if search was performed

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setRecentSearches(Array.isArray(parsed) ? parsed : [])
        } catch (e) {
          console.error('Error parsing recent searches:', e)
        }
      }
    }
  }, [])

  // Auto-focus search input only if focus=true in query params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const shouldFocus = searchParams.get('focus') === 'true'
    
    if (shouldFocus && searchInputRef.current) {
      // Small delay to ensure the input is fully rendered
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [])

  // Save search to recent searches
  const saveToRecentSearches = (query: string) => {
    if (!query.trim()) return
    
    const trimmed = query.trim()
    setRecentSearches(prev => {
      // Remove if already exists
      const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase())
      // Add to beginning
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      }
      
      return updated
    })
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
      const userSongs = await repo.getAllSongs()
      
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
      const isHebrewText = isHebrew(query)
      const source = isHebrewText ? 'tab4u' : 'ultimate-guitar'
      
      const response = await fetch(`/api/songs/search?q=${encodeURIComponent(query.trim())}&source=${source}`)
      const data = await response.json()

      if (response.ok && data.results) {
        setSearchResults(data.results)
        saveToRecentSearches(query.trim())
        // Check if results exist in user's songs
        await checkExistingSongs(data.results)
      } else {
        const errorMsg = data.error || t('search.noResultsFor').replace('{query}', query)
        setMessage({ type: 'error', text: errorMsg })
        setSearchResults([])
        setExistingSongs(new Map())
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
  }, [checkExistingSongs, t])

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (searchQuery.trim()) {
        performSearch(searchQuery)
      }
    }
  }

  // Handle recent search click
  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query)
    performSearch(query)
  }

  // Handle clear search - Reset all search state
  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setExistingSongs(new Map())
    setMessage(null)
    setHasSearched(false)
    setIsInputFocused(false)
    setAddingSongId(null)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Handle input focus
  const handleInputFocus = () => {
    setIsInputFocused(true)
  }

  // Handle input blur
  const handleInputBlur = () => {
    // Delay to allow click on recent search items
    setTimeout(() => {
      setIsInputFocused(false)
    }, 200)
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

  const hasSearchResults = searchQuery.trim() && searchResults.length > 0
  const showLibrarySections = !searchQuery.trim() && !isInputFocused

  return (
    <div className="p-4 sm:p-6 lg:px-0 lg:py-8 overflow-y-auto min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto lg:max-w-none lg:mx-0">
        {/* Search Input - Full Width */}
        <div className="mb-6 relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={t('search.searchPlaceholder')}
              className="block w-full pl-12 pr-12 py-4 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                type="button"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-md ${
            message.type === 'error' 
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' 
              : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <span>{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {(isSearching || isCheckingExisting) && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {isSearching ? t('search.searching') : t('search.checkingExisting')}
            </p>
          </div>
        )}

        {/* Recent Searches Dropdown - Shown when input is focused and empty */}
        {isInputFocused && !searchQuery.trim() && recentSearches.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2">
                Recherches récentes
              </div>
              {recentSearches.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(query)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{query}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {!isSearching && !isCheckingExisting && hasSearchResults && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Résultats de recherche ({searchResults.length})
            </h2>
            <div className="space-y-4">
              {searchResults.map((result, index) => {
                const existingSongId = existingSongs.get(index)
                const imageUrl = result.songImageUrl || result.artistImageUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop'
                const isAdding = addingSongId === result.url

                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                  >
                    {/* Image */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden relative">
                      <Image
                        src={imageUrl}
                        alt={result.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {result.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {result.author}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {result.source && (
                          <span className="capitalize">{result.source}</span>
                        )}
                        {result.rating && (
                          <span>⭐ {result.rating.toFixed(1)}</span>
                        )}
                        {result.reviews && (
                          <span>💬 {result.reviews}</span>
                        )}
                        {result.difficulty && (
                          <span>🎸 {result.difficulty}</span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      {existingSongId ? (
                        <Link
                          href={`/song/${existingSongId}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ArrowRightIcon className="h-4 w-4" />
                          {t('search.viewSong')}
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleAddSong(result, index)}
                          disabled={isAdding || !userId}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isAdding ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              {t('search.addingSong')}
                            </>
                          ) : (
                            <>
                              <PlusIcon className="h-4 w-4" />
                              {t('common.create')}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No Results - Only show if search was performed (Enter pressed) */}
        {!isSearching && !isCheckingExisting && hasSearched && searchQuery.trim() && searchResults.length === 0 && !message && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t('search.noResultsFor').replace('{query}', searchQuery)}
            </p>
          </div>
        )}

        {/* Library Sections - Shown when no search and input not focused */}
        {!isSearching && !isCheckingExisting && showLibrarySections && children}
      </div>
    </div>
  )
}
