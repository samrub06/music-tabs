'use client';

import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface AddSongFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  title: string;
  author: string;
  url: string;
  source: string;
  reviews?: number; // Nombre de reviews/évaluations
}

export default function AddSongForm({ isOpen, onClose }: AddSongFormProps) {
  const { addSong, folders, importSongs } = useApp();
  const { t } = useLanguage();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert(t('songForm.titleRequired'));
      return;
    }

    await addSong({
      title: formData.title.trim(),
      author: formData.author.trim(),
      content: formData.content.trim(),
      folderId: formData.folderId || undefined
    });

    // Reset form
    setFormData({
      title: '',
      author: '',
      content: '',
      folderId: ''
    });

    onClose();
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

  // Rechercher sur les tabs de guitare (EN/FR)
  const handleSearchUltimateGuitar = async () => {
    if (!searchQuery.trim()) {
      console.log('Please enter a title or artist to search.');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(`/api/songs/search?q=${encodeURIComponent(searchQuery)}&source=ultimate-guitar`);
      const data = await response.json();

      if (response.ok && data.results) {
        setSearchResults(data.results);
        setShowSearchResults(true);
      } else {
        alert(data.error || 'Aucune partition trouvée.');
      }
    } catch (error) {
      console.error('Error searching:', error);
      alert('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setIsSearching(false);
    }
  };

  // Rechercher sur Tab4U (hébreu)
  const handleSearchTab4U = async () => {
    if (!searchQuery.trim()) {
      alert('נא להזין שם שיר או אמן.');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(`/api/songs/search?q=${encodeURIComponent(searchQuery)}&source=tab4u`);
      const data = await response.json();

      if (response.ok && data.results) {
        setSearchResults(data.results);
        setShowSearchResults(true);
      } else {
        alert(data.error || 'לא נמצאו תוצאות ב-Tab4U.');
      }
    } catch (error) {
      console.error('Error searching:', error);
      alert('שגיאה בחיפוש. נסה שוב.');
    } finally {
      setIsSearching(false);
    }
  };

  // Récupérer une partition depuis une URL
  const handleFetchFromUrl = async (url: string, searchResult?: SearchResult) => {
    setIsSearching(true);
    setMessage(null);
    
    try {
      const response = await fetch(`/api/songs/search?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (response.ok && data.song) {
        // Use search result data as fallback for title and author
        const songData = {
          ...data.song,
          title: searchResult?.title || data.song.title || 'Unknown title',
          author: searchResult?.author || data.song.author || 'Unknown artist',
          reviews: searchResult?.reviews || data.song.reviews || 0,
          capo: data.song.capo,
          key: data.song.key
        };
        
        // Directly save the song without showing preview
        await handleDirectSave(songData);
      } else {
        setMessage({ type: 'error', text: data.error || '❌ Unable to retrieve the song.' });
      }
    } catch (error) {
      console.error('Error fetching song:', error);
      setMessage({ type: 'error', text: '❌ Error retrieving the song. Please try again.' });
    } finally {
      setIsSearching(false);
    }
  };

  // Direct save function for scraped songs
  const handleDirectSave = async (songData: { title: string; author: string; content: string; reviews?: number; capo?: number; key?: string }) => {
    if (!songData.title.trim() || !songData.content.trim()) {
      setMessage({ type: 'error', text: 'Données de chanson invalides.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await addSong({
        title: songData.title.trim(),
        author: songData.author.trim(),
        content: songData.content.trim(),
        folderId: formData.folderId || undefined,
        reviews: songData.reviews || 0,
        capo: songData.capo,
        key: songData.key
      });

      // Reset search results
      setShowSearchResults(false);
      setSearchResults([]);
      setSearchQuery('');

      // Show success message
      setMessage({ type: 'success', text: `✅ "${songData.title}" by ${songData.author} added successfully!` });
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error adding song:', error);
      setMessage({ type: 'error', text: '❌ Error adding song. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
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
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUltimateGuitar()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('songForm.searchPlaceholder')}
                  disabled={isSearching}
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSearchUltimateGuitar}
                  disabled={isSearching || !searchQuery.trim()}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="text-lg">🎸</span>
                  {isSearching ? t('songForm.loading') : t('songForm.enFrSongs')}
                </button>
                <button
                  onClick={handleSearchTab4U}
                  disabled={isSearching || !searchQuery.trim()}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="text-lg">🇮🇱</span>
                  {isSearching ? t('songForm.loading') : t('songForm.hebrewSongs')}
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
                            <div className="text-sm font-medium text-gray-900">
                              {result.title}
                            </div>
                            <div className="text-xs text-gray-600">
                              {result.author}
                            </div>
                          </div>
                          {result.reviews !== undefined && result.reviews > 0 && (
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-2">
                              ⭐ {result.reviews} avis
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-md">
                <p className="font-medium mb-1">💡 {t('songForm.howToUse')}</p>
                <ul className="space-y-1">
                  <li>• <strong>🎸 {t('songForm.enFrSongs')}</strong></li>
                  <li>• <strong>🇮🇱 {t('songForm.hebrewSongs')}</strong></li>
                  <li>• {t('songForm.clickToLoad')}</li>
                  <li>• {t('songForm.sortedByPopularity')}</li>
                </ul>
              </div>
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
                  rows={12}
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
                  onClick={handleReset}
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
    </div>
  );
}
