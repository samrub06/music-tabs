'use client';

import { useLanguage } from '@/context/LanguageContext';
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NewSongData, Folder } from '@/types';
import { addSongAction } from '@/app/(protected)/dashboard/actions';

interface AddSongFormProps {
  isOpen: boolean;
  onClose: () => void;
  folders?: Folder[];
}

interface SearchResult {
  title: string;
  author: string;
  url: string;
  source: string;
  reviews?: number;
  rating?: number;
  difficulty?: string;
  version?: number;
  versionDescription?: string;
  artistUrl?: string;
  artistImageUrl?: string;
  songImageUrl?: string;
  sourceUrl?: string;
  sourceSite?: string;
}

export default function AddSongForm({ isOpen, onClose, folders = [] }: AddSongFormProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    content: '',
    folderId: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  // Normalize song data
  function normalizeNewSongData(d: NewSongData): NewSongData {
    return {
      ...d,
      title: d.title.trim(),
      author: (d.author || '').trim(),
      content: d.content.trim(),
      folderId: d.folderId || undefined,
    };
  }

  // Unified save function
  const saveNewSong = async (payload: NewSongData, opts?: { redirect?: boolean }) => {
    setIsSaving(true);
    setMessage(null);
    try {
      const newSong = await addSongAction(normalizeNewSongData(payload));
      if (opts?.redirect) {
        router.push(`/song/${newSong.id}`);
      }
      onClose();
    } catch (error) {
      console.error('Error adding song:', error);
      const errorMessage = error instanceof Error ? error.message : t('search.addError');
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert(t('songForm.titleRequired'));
      return;
    }

    await saveNewSong({
      title: formData.title,
      author: formData.author,
      content: formData.content,
      folderId: formData.folderId,
    });

    // Reset form
    setFormData({
      title: '',
      author: '',
      content: '',
      folderId: ''
    });
  };


  const handleReset = () => {
    setFormData({
      title: '',
      author: '',
      content: '',
      folderId: ''
    });
    setSearchResults([]);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Fonction pour détecter si le texte contient des caractères hébreux
  const isHebrew = (text: string) => {
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(text);
  };

  // Recherche automatique qui détecte la langue
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert(t('search.enterTitleOrArtist'));
      return;
    }

    const isHebrewText = isHebrew(searchQuery);
    const source = isHebrewText ? 'tab4u' : 'ultimate-guitar';
    
    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(`/api/songs/search?q=${encodeURIComponent(searchQuery)}&source=${source}`);
      const data = await response.json();

      if (response.ok && Array.isArray(data.results) && data.results.length > 0) {
        console.log('Search results:', data.results); // Debug log
        setSearchResults(data.results);
        setShowSearchResults(true);
      } else {
        alert(data.error || (data.blocked ? t('search.ugBlocked') : t('search.searchError')));
      }
    } catch (error) {
      console.error('Error searching:', error);
      alert(t('search.searchError'));
    } finally {
      setIsSearching(false);
    }
  };

  // Récupérer une partition depuis une URL
  const handleFetchFromUrl = async (url: string, searchResult?: SearchResult) => {
    setIsSearching(true);
    setMessage(null);
    
    try {
      // Passer les données de recherche à l'API pour enrichir le scraping
      const searchResultParam = searchResult ? encodeURIComponent(JSON.stringify(searchResult)) : '';
      const response = await fetch(`/api/songs/search?url=${encodeURIComponent(url)}&searchResult=${searchResultParam}`);
      const data = await response.json();
      console.log('Data:', data);

      if (response.ok && data.song) {
        console.log('Song data:', data.song);
        // Construire le payload une seule fois et sauvegarder directement
        const payload = buildNewSongDataFromScrape(data.song, searchResult, formData.folderId);
        await handleDirectSave(payload);
      } else {
        setMessage({ type: 'error', text: data.error || t('errors.retrieveError') });
      }
    } catch (error) {
      console.error('Error fetching song:', error);
      setMessage({ type: 'error', text: t('errors.retrieveErrorRetry') });
    } finally {
      setIsSearching(false);
    }
  };

  // Construit un payload normalisé pour l'ajout, basé sur le scraping et le résultat de recherche
  function buildNewSongDataFromScrape(
    scraped: Partial<NewSongData> & { url?: string; source?: string; songImageUrl?: string },
    result?: SearchResult,
    folderId?: string
  ): NewSongData {
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
    } as NewSongData;
  }

  // Direct save function for scraped songs
  const handleDirectSave = async (songData: NewSongData) => {
    if (!songData.title.trim() || !songData.content.trim()) {
      setMessage({ type: 'error', text: t('errors.invalidSongData') });
      return;
    }

    await saveNewSong(songData, { redirect: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 md:top-8 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {t('songForm.addSong')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Message d'erreur/succès */}
        {message && (
          <div className={`mb-4 p-3 rounded-md ${
            message.type === 'error' 
              ? 'bg-red-50 border border-red-200 text-red-800' 
              : message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center justify-between">
              <span>{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Online Search */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-800 flex items-center">
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              {t('songForm.searchSongs')}
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('songForm.songTitle')} ou {t('songForm.artist')}
                </label>
                <div className="relative">
                <input
                  type="text"
                  ref={searchInputRef}
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('songForm.searchPlaceholder')}
                  disabled={isSearching}
                />
                  {searchQuery && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSearchQuery('')
                        setSearchResults([])
                        setShowSearchResults(false)
                      }}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
                      type="button"
                      disabled={isSearching}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="text-lg">🔍</span>
                  {isSearching ? t('songForm.loading') : t('songForm.search')}
                </button>
              </div>

              {/* Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="border border-gray-300 rounded-md p-3 max-h-96 overflow-y-auto">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">
                    {t('songForm.searchResults')} ({searchResults.length})
                  </h5>
                  <div className="space-y-2">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleFetchFromUrl(result.url, result)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 leading-tight">
                              {result.title}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <div className="text-xs text-gray-600">
                                {result.author}
                              </div>
                              {/* Afficher le rating et la difficulté sur la même ligne */}
                              <div className="flex items-center gap-1">
                                {result.rating && (
                                  <div className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-full">
                                    ⭐ {result.rating.toFixed(1)}
                                  </div>
                                )}
                                {result.difficulty && (
                                  <div className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                    🎸 {result.difficulty}
                                  </div>
                                )}
                                {result.reviews !== undefined && result.reviews > 0 && (
                                  <div className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
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

              {!showSearchResults && (
                <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-md">
                  <p className="font-medium mb-1">💡 {t('songForm.howToUse')}</p>
                  <ul className="space-y-1">
                    <li>• {t('songForm.clickToLoad')}</li>
                    <li>• {t('songForm.sortedByPopularity')}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Manual Entry Form */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-800 flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              {t('songForm.manualEntry')}
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('songForm.songTitle')} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ex: Ma chanson préférée"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('songForm.artist')}
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ex: Mon Artiste"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('songs.folder')}
                </label>
                <select
                  value={formData.folderId}
                  onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('songs.unorganized')}</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('songForm.chords')} + {t('songForm.lyrics')} *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder={`[Intro]
C   G   Am  F

[Verse 1]
C                    G
Voici un exemple de chanson
Am                   F
Avec les accords alignés...`}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    onClose();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  {t('songForm.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  {t('songForm.addSong')}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
      {isSaving && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-[60]">
          <div className="bg-white rounded-md shadow p-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div className="text-sm text-gray-700">{t('songForm.loading')} • Redirection...</div>
          </div>
        </div>
      )}
    </div>
  );
}
