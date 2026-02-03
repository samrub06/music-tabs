'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SparklesIcon, MagnifyingGlassIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { generatePlaylistWithAIAction, createPlaylistWithSongsAction } from './actions'
import { addSongAction } from '@/app/(protected)/dashboard/actions'
import { Folder, NewSongData } from '@/types'
import type { PlaylistResult } from '@/lib/services/playlistGeneratorService'

interface AIPlaylistClientProps {
  folders: Folder[]
}

interface AIGeneratedSong {
  title: string
  artist: string
}

interface SongSearchResult {
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

interface ProcessedSong {
  aiSong: AIGeneratedSong
  searchResults: SongSearchResult[]
  selectedResult: SongSearchResult | null
  isSearching: boolean
  isFound: boolean
  isSelected: boolean
  isAdding: boolean
  addedSongId?: string
}

export default function AIPlaylistClient({ folders }: AIPlaylistClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [processedSongs, setProcessedSongs] = useState<ProcessedSong[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')
  const [isAddingSongs, setIsAddingSongs] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [playlistName, setPlaylistName] = useState('')
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)

  // Fonction pour détecter si le texte contient des caractères hébreux
  const isHebrew = (text: string) => {
    const hebrewRegex = /[\u0590-\u05FF]/
    return hebrewRegex.test(text)
  }

  // Générer la playlist avec AI
  const handleGenerate = async () => {
    if (!description.trim()) {
      setMessage({ type: 'error', text: t('aiPlaylist.enterDescription') })
      return
    }

    setIsGenerating(true)
    setProcessedSongs([])
    setMessage(null)

    try {
      const result = await generatePlaylistWithAIAction(description.trim())

      if (!result.success || result.songs.length === 0) {
        setMessage({
          type: 'error',
          text: result.error || t('aiPlaylist.generationFailed')
        })
        setIsGenerating(false)
        return
      }

      // Initialiser les chansons à traiter
      const initialProcessed: ProcessedSong[] = result.songs.map(aiSong => ({
        aiSong,
        searchResults: [],
        selectedResult: null,
        isSearching: false,
        isFound: false,
        isSelected: false,
        isAdding: false
      }))

      setProcessedSongs(initialProcessed)

      // Rechercher chaque chanson en parallèle (avec limite de concurrence)
      // Pass preferredSource from AI detection
      await searchAllSongs(initialProcessed, result.preferredSource)
    } catch (error) {
      console.error('Error generating playlist:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('aiPlaylist.generationError')
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Rechercher toutes les chansons avec limite de concurrence
  const searchAllSongs = async (songs: ProcessedSong[], preferredSource?: 'tab4u' | 'ultimate-guitar') => {
    const CONCURRENT_LIMIT = 3 // Limiter à 3 recherches simultanées

    for (let i = 0; i < songs.length; i += CONCURRENT_LIMIT) {
      const batch = songs.slice(i, i + CONCURRENT_LIMIT)
      await Promise.all(batch.map(song => searchSong(song, preferredSource)))
    }
  }

  // Rechercher une chanson spécifique
  const searchSong = async (song: ProcessedSong, preferredSource?: 'tab4u' | 'ultimate-guitar') => {
    const query = `${song.aiSong.title} ${song.aiSong.artist}`
    // Use preferredSource from AI detection if available, otherwise fallback to Hebrew text detection
    const isHebrewText = isHebrew(query)
    const source = preferredSource || (isHebrewText ? 'tab4u' : 'ultimate-guitar')

    setProcessedSongs(prev => prev.map(s =>
      s.aiSong.title === song.aiSong.title && s.aiSong.artist === song.aiSong.artist
        ? { ...s, isSearching: true }
        : s
    ))

    try {
      const response = await fetch(`/api/songs/search?q=${encodeURIComponent(query)}&source=${source}`)
      const data = await response.json()

      if (response.ok && data.results && data.results.length > 0) {
        // Trouver le meilleur résultat (premier par défaut, ou celui avec le meilleur rating)
        const bestResult = data.results[0]
        setProcessedSongs(prev => prev.map(s =>
          s.aiSong.title === song.aiSong.title && s.aiSong.artist === song.aiSong.artist
            ? {
                ...s,
                searchResults: data.results,
                selectedResult: bestResult,
                isFound: true,
                isSelected: true, // Sélectionné par défaut
                isSearching: false
              }
            : s
        ))
      } else {
        setProcessedSongs(prev => prev.map(s =>
          s.aiSong.title === song.aiSong.title && s.aiSong.artist === song.aiSong.artist
            ? { ...s, isFound: false, isSearching: false }
            : s
        ))
      }
    } catch (error) {
      console.error('Error searching song:', error)
      setProcessedSongs(prev => prev.map(s =>
        s.aiSong.title === song.aiSong.title && s.aiSong.artist === song.aiSong.artist
          ? { ...s, isFound: false, isSearching: false }
          : s
      ))
    }
  }

  // Sélectionner un résultat de recherche pour une chanson
  const handleSelectResult = (song: ProcessedSong, result: SongSearchResult) => {
    setProcessedSongs(prev => prev.map(s =>
      s.aiSong.title === song.aiSong.title && s.aiSong.artist === song.aiSong.artist
        ? { ...s, selectedResult: result, isSelected: true }
        : s
    ))
  }

  // Toggle sélection d'une chanson
  const handleToggleSelection = (song: ProcessedSong) => {
    if (!song.isFound) return
    setProcessedSongs(prev => prev.map(s =>
      s.aiSong.title === song.aiSong.title && s.aiSong.artist === song.aiSong.artist
        ? { ...s, isSelected: !s.isSelected }
        : s
    ))
  }

  // Construire le payload pour ajouter une chanson
  const buildNewSongDataFromScrape = (
    scraped: Partial<NewSongData> & { url?: string; source?: string; songImageUrl?: string },
    result?: SongSearchResult,
    folderId?: string
  ): NewSongData => {
    return {
      title: (scraped.title || result?.title || t('songs.unknownTitle')).trim(),
      author: (scraped.author || result?.author || t('songs.unknownArtist')).trim(),
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

  // Ajouter toutes les chansons sélectionnées
  const handleAddSongs = async () => {
    const selectedSongs = processedSongs.filter(s => s.isSelected && s.isFound && !s.addedSongId)
    
    if (selectedSongs.length === 0) {
      setMessage({ type: 'error', text: t('aiPlaylist.noSongsSelected') })
      return
    }

    setIsAddingSongs(true)
    setMessage(null)

    const addedSongIds: string[] = []

    try {
      for (const song of selectedSongs) {
        if (!song.selectedResult) continue

        setProcessedSongs(prev => prev.map(s =>
          s.aiSong.title === song.aiSong.title && s.aiSong.artist === song.aiSong.artist
            ? { ...s, isAdding: true }
            : s
        ))

        try {
          // Scraper la chanson depuis l'URL
          const searchResultParam = encodeURIComponent(JSON.stringify(song.selectedResult))
          const response = await fetch(`/api/songs/search?url=${encodeURIComponent(song.selectedResult.url)}&searchResult=${searchResultParam}`)
          const data = await response.json()

          if (response.ok && data.song) {
            const payload = buildNewSongDataFromScrape(data.song, song.selectedResult, selectedFolderId || undefined)
            
            if (payload.title.trim() && payload.content.trim()) {
              const normalizedPayload: NewSongData = {
                ...payload,
                title: payload.title.trim(),
                author: (payload.author || '').trim(),
                content: payload.content.trim(),
              }

              const newSong = await addSongAction(normalizedPayload)
              addedSongIds.push(newSong.id)

              setProcessedSongs(prev => prev.map(s =>
                s.aiSong.title === song.aiSong.title && s.aiSong.artist === song.aiSong.artist
                  ? { ...s, isAdding: false, addedSongId: newSong.id }
                  : s
              ))
            }
          }
        } catch (error) {
          console.error(`Error adding song ${song.aiSong.title}:`, error)
          setProcessedSongs(prev => prev.map(s =>
            s.aiSong.title === song.aiSong.title && s.aiSong.artist === song.aiSong.artist
              ? { ...s, isAdding: false }
              : s
          ))
        }
      }

      if (addedSongIds.length > 0) {
        setMessage({
          type: 'success',
          text: t('aiPlaylist.songsAdded').replace('{count}', String(addedSongIds.length))
        })
        // Proposer de créer une playlist
        setShowPlaylistModal(true)
      }
    } catch (error) {
      console.error('Error adding songs:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('aiPlaylist.addError')
      })
    } finally {
      setIsAddingSongs(false)
    }
  }

  // Sauvegarder comme playlist
  const handleSaveAsPlaylist = async () => {
    if (!playlistName.trim()) {
      setMessage({ type: 'error', text: t('aiPlaylist.playlistNameRequired') })
      return
    }

    const addedSongs = processedSongs.filter(s => s.addedSongId)
    if (addedSongs.length === 0) {
      setMessage({ type: 'error', text: t('aiPlaylist.noSongsAdded') })
      return
    }

    try {
      // Créer la playlist via Server Action
      const playlist = await createPlaylistWithSongsAction(
        playlistName.trim(),
        `Playlist générée par AI: ${description}`,
        addedSongs.map(s => s.addedSongId!).filter(Boolean)
      )

      setMessage({ type: 'success', text: t('aiPlaylist.playlistCreated') })
      setShowPlaylistModal(false)
      router.push(`/playlists`)
      router.refresh()
    } catch (error) {
      console.error('Error creating playlist:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('aiPlaylist.playlistError')
      })
    }
  }

  const foundCount = processedSongs.filter(s => s.isFound).length
  const selectedCount = processedSongs.filter(s => s.isSelected && s.isFound).length
  const addedCount = processedSongs.filter(s => s.addedSongId).length

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-6">
      {/* Header avec icône - Mobile optimisé */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
              {t('aiPlaylist.title')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
              {t('aiPlaylist.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-md text-sm sm:text-base ${
          message.type === 'error' 
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' 
            : message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <span className="flex-1 break-words">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2 flex-shrink-0"
              aria-label={t('common.close')}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Formulaire de génération */}
      <div className="mb-4 sm:mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('aiPlaylist.styleDescription')}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder={t('aiPlaylist.stylePlaceholder')}
            disabled={isGenerating}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t('aiPlaylist.styleHint')}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className="w-full flex items-center justify-center px-4 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm sm:text-base font-medium rounded-lg transition-colors active:scale-95"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
              <span className="text-sm sm:text-base">{t('aiPlaylist.generating')}</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="text-sm sm:text-base">{t('aiPlaylist.generate')}</span>
            </>
          )}
        </button>
      </div>

      {/* Résultats */}
      {processedSongs.length > 0 && (
        <div className="space-y-3 sm:space-y-4 pb-20 sm:pb-0">
          {/* Statistiques */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div className="px-1">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">{processedSongs.length}</div>
                <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 leading-tight mt-0.5">{t('aiPlaylist.totalSongs')}</div>
              </div>
              <div className="px-1">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">{foundCount}</div>
                <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 leading-tight mt-0.5">{t('aiPlaylist.foundSongs')}</div>
              </div>
              <div className="px-1">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedCount}</div>
                <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 leading-tight mt-0.5">{t('aiPlaylist.selectedSongs')}</div>
              </div>
            </div>
          </div>

          {/* Sélecteur de dossier */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('aiPlaylist.selectFolder')}
            </label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">{t('aiPlaylist.noFolder')}</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>

          {/* Liste des chansons */}
          <div className="space-y-2 sm:space-y-3">
            {processedSongs.map((song, index) => (
              <div
                key={`${song.aiSong.title}-${song.aiSong.artist}-${index}`}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${
                  song.isSelected && song.isFound
                    ? 'border-emerald-500 dark:border-emerald-400'
                    : 'border-gray-200 dark:border-gray-700'
                } p-3 sm:p-4`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={song.isSelected && song.isFound}
                    onChange={() => handleToggleSelection(song)}
                    disabled={!song.isFound || song.isSearching || song.isAdding}
                    className="mt-1 h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded flex-shrink-0"
                  />
                  
                  {/* Info chanson */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                          {song.aiSong.title}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                          {song.aiSong.artist}
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="ml-2 flex-shrink-0">
                        {song.isSearching && (
                          <div className="flex items-center text-blue-600 dark:text-blue-400">
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600 mr-1"></div>
                            <span className="text-xs hidden sm:inline">{t('aiPlaylist.searching')}</span>
                          </div>
                        )}
                        {!song.isSearching && song.isFound && (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-xs ml-1 hidden sm:inline">{t('aiPlaylist.found')}</span>
                          </div>
                        )}
                        {!song.isSearching && !song.isFound && (
                          <div className="flex items-center text-red-600 dark:text-red-400">
                            <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-xs ml-1 hidden sm:inline">{t('aiPlaylist.notFound')}</span>
                          </div>
                        )}
                        {song.addedSongId && (
                          <div className="flex items-center text-emerald-600 dark:text-emerald-400 mt-1">
                            <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-xs ml-1 hidden sm:inline">{t('aiPlaylist.added')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Résultats de recherche */}
                    {song.searchResults.length > 0 && (
                      <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                        {song.searchResults.map((result, resultIndex) => (
                          <div
                            key={resultIndex}
                            onClick={() => handleSelectResult(song, result)}
                            className={`p-2 sm:p-2.5 rounded border cursor-pointer transition-colors active:scale-95 ${
                              song.selectedResult?.url === result.url
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0 pr-1">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {result.title}
                                </div>
                                <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                                  {result.author}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5 sm:gap-2 flex-shrink-0">
                                {result.rating && (
                                  <span className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400 whitespace-nowrap">
                                    ⭐ {result.rating.toFixed(1)}
                                  </span>
                                )}
                                {song.selectedResult?.url === result.url && (
                                  <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Boutons d'action */}
          {selectedCount > 0 && (
            <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 -mx-3 sm:-mx-4 lg:-mx-6 shadow-lg sm:shadow-none">
              <button
                onClick={handleAddSongs}
                disabled={isAddingSongs || selectedCount === 0}
                className="w-full flex items-center justify-center px-4 py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm sm:text-base font-medium rounded-lg transition-colors active:scale-95 shadow-md sm:shadow-none"
              >
                {isAddingSongs ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                    <span>{t('aiPlaylist.adding')}</span>
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base">{t('aiPlaylist.addSelected').replace('{count}', String(selectedCount))}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal pour créer la playlist */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4 sm:p-0">
          <div className="bg-white dark:bg-gray-800 rounded-t-lg sm:rounded-lg shadow-lg p-4 sm:p-6 max-w-md w-full sm:mx-4 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('aiPlaylist.saveAsPlaylist')}
            </h3>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && playlistName.trim() && handleSaveAsPlaylist()}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-4"
              placeholder={t('aiPlaylist.playlistNamePlaceholder')}
              autoFocus
            />
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleSaveAsPlaylist}
                disabled={!playlistName.trim()}
                className="flex-1 px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm sm:text-base font-medium rounded-lg transition-colors active:scale-95"
              >
                {t('common.save')}
              </button>
              <button
                onClick={() => {
                  setShowPlaylistModal(false)
                  setPlaylistName('')
                }}
                className="flex-1 px-4 py-2.5 sm:py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm sm:text-base font-medium rounded-lg transition-colors active:scale-95"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
