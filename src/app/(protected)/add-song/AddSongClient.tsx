'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { addSongAction } from '@/app/(protected)/dashboard/actions'
import { NewSongData, Folder } from '@/types'

interface AddSongClientProps {
  folders: Folder[]
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

export default function AddSongClient({ folders }: AddSongClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fonction pour détecter si le texte contient des caractères hébreux
  const isHebrew = (text: string) => {
    const hebrewRegex = /[\u0590-\u05FF]/
    return hebrewRegex.test(text)
  }

  // Recherche automatique qui détecte la langue
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage({ type: 'error', text: 'Veuillez entrer un titre ou un artiste à rechercher.' })
      return
    }

    const isHebrewText = isHebrew(searchQuery)
    const source = isHebrewText ? 'tab4u' : 'ultimate-guitar'
    
    setIsSearching(true)
    setSearchResults([])
    setMessage(null)

    try {
      const response = await fetch(`/api/songs/search?q=${encodeURIComponent(searchQuery)}&source=${source}`)
      const data = await response.json()

      if (response.ok && data.results) {
        setSearchResults(data.results)
        setShowSearchResults(true)
      } else {
        const errorMsg = isHebrewText 
          ? data.error || 'לא נמצאו תוצאות ב-Tab4U.'
          : data.error || 'Aucune partition trouvée.'
        setMessage({ type: 'error', text: errorMsg })
      }
    } catch (error) {
      console.error('Error searching:', error)
      const errorMsg = isHebrewText 
        ? 'שגיאה בחיפוש. נסה שוב.'
        : 'Erreur lors de la recherche. Veuillez réessayer.'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setIsSearching(false)
    }
  }

  // Construit un payload normalisé pour l'ajout, basé sur le scraping et le résultat de recherche
  function buildNewSongDataFromScrape(
    scraped: Partial<NewSongData> & { url?: string; source?: string; songImageUrl?: string },
    result?: SearchResult,
    folderId?: string
  ): NewSongData {
    return {
      title: (scraped.title || result?.title || 'Unknown title').trim(),
      author: (scraped.author || result?.author || 'Unknown artist').trim(),
      content: (scraped as any).content || '',
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
      genre: (scraped as any).songGenre || (scraped as any).genre,
      bpm: scraped.bpm
    } as NewSongData
  }

  // Récupérer une partition depuis une URL
  const handleFetchFromUrl = async (url: string, searchResult?: SearchResult) => {
    setIsSaving(true)
    setMessage(null)
    
    try {
      // Passer les données de recherche à l'API pour enrichir le scraping
      const searchResultParam = searchResult ? encodeURIComponent(JSON.stringify(searchResult)) : ''
      const response = await fetch(`/api/songs/search?url=${encodeURIComponent(url)}&searchResult=${searchResultParam}`)
      const data = await response.json()

      if (response.ok && data.song) {
        // Construire le payload et sauvegarder
        const payload = buildNewSongDataFromScrape(data.song, searchResult)
        
        if (!payload.title.trim() || !payload.content.trim()) {
          setMessage({ type: 'error', text: 'Données de chanson invalides.' })
          return
        }

        // Normaliser les données
        const normalizedPayload: NewSongData = {
          ...payload,
          title: payload.title.trim(),
          author: (payload.author || '').trim(),
          content: payload.content.trim(),
        }

        const newSong = await addSongAction(normalizedPayload)
        router.push(`/song/${newSong.id}`)
      } else {
        setMessage({ type: 'error', text: data.error || '❌ Unable to retrieve the song.' })
      }
    } catch (error) {
      console.error('Error fetching song:', error)
      const errorMessage = error instanceof Error ? error.message : '❌ Error retrieving the song. Please try again.'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Rechercher une chanson
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Recherchez des partitions sur Ultimate Guitar ou Tab4U
        </p>
      </div>

      {/* Message d'erreur/succès */}
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'error' 
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' 
            : message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
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

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-lg"
            placeholder="Rechercher un titre ou un artiste..."
            disabled={isSearching || isSaving}
          />
          {searchQuery && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSearchQuery('')
                setSearchResults([])
                setShowSearchResults(false)
                setMessage(null)
              }}
              className="absolute inset-y-0 right-12 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              type="button"
              disabled={isSearching || isSaving}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={handleSearch}
            disabled={isSearching || isSaving || !searchQuery.trim()}
            className="absolute inset-y-0 right-0 px-4 flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Résultats de recherche */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Résultats ({searchResults.length})
          </h2>
          <div className="space-y-2">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => !isSaving && handleFetchFromUrl(result.url, result)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-base font-medium text-gray-900 dark:text-gray-100 leading-tight mb-1">
                      {result.title}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {result.author}
                      </div>
                      <div className="flex items-center gap-2">
                        {result.rating && (
                          <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                            ⭐ {result.rating.toFixed(1)}
                          </div>
                        )}
                        {result.difficulty && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                            🎸 {result.difficulty}
                          </div>
                        )}
                        {result.reviews !== undefined && result.reviews > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            👥 {result.reviews}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showSearchResults && !isSearching && (
        <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="font-medium mb-2">💡 Comment utiliser</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Entrez un titre de chanson ou un nom d'artiste</li>
            <li>Cliquez sur un résultat pour l'ajouter à votre bibliothèque</li>
            <li>Les résultats sont triés par popularité</li>
          </ul>
        </div>
      )}

      {/* Loading overlay */}
      {isSaving && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div className="text-sm text-gray-700 dark:text-gray-300">Ajout de la chanson...</div>
          </div>
        </div>
      )}
    </div>
  )
}
