'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SparklesIcon, MusicalNoteIcon, PlayIcon, MagnifyingGlassIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/context/LanguageContext';
import { Song, Playlist } from '@/types';

type SortField = 'name' | 'songCount' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface PlaylistsClientProps {
  songs: Song[];
  playlists: Playlist[];
}

export default function PlaylistsClient({ songs, playlists }: PlaylistsClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localSearchValue, setLocalSearchValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Debounced search - update searchQuery after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchValue]);

  // Filter playlists based on search query
  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) {
      return playlists;
    }

    const query = searchQuery.toLowerCase().trim();
    return playlists.filter(playlist => 
      playlist.name.toLowerCase().includes(query) ||
      (playlist.description && playlist.description.toLowerCase().includes(query))
    );
  }, [playlists, searchQuery]);

  // Sort playlists
  const sortedPlaylists = useMemo(() => {
    return [...filteredPlaylists].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'songCount':
          aValue = a.songIds.length;
          bValue = b.songIds.length;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPlaylists, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle search expansion (mobile)
  const handleSearchIconClick = () => {
    setIsSearchExpanded(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left font-medium text-gray-900 hover:text-gray-700 focus:outline-none"
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? 
          <ChevronUpIcon className="h-4 w-4" /> : 
          <ChevronDownIcon className="h-4 w-4" />
      )}
    </button>
  );

  const handleStartSavedPlaylist = (playlist: Playlist) => {
    // Get songs from songIds
    const playlistSongs = playlist.songIds
      .map(id => songs.find(s => s.id === id))
      .filter((song): song is Song => song !== undefined);

    if (playlistSongs.length === 0) return;

    // Save playlist context to sessionStorage
    if (typeof window !== 'undefined') {
      const songList = playlistSongs.map(s => s.id);
      const playlistContext = {
        isPlaylist: true,
        targetKey: '', // Saved playlists don't have key progression info
        songs: playlistSongs.map(s => ({
          id: s.id,
          keyAdjustment: 0,
          originalKey: s.key || '',
          targetKey: s.key || ''
        }))
      };

      const navigationData = {
        songList,
        currentIndex: 0,
        sourceUrl: '/playlists',
        playlistContext
      };

      sessionStorage.setItem('songNavigation', JSON.stringify(navigationData));
      sessionStorage.removeItem('hasUsedNext'); // Reset navigation state

      // Navigate to first song
      router.push(`/song/${playlistSongs[0].id}`);
    }
  };

  const showEmptyState = sortedPlaylists.length === 0;

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
      {/* Header - Desktop Only */}
      <div className="hidden lg:block mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Playlists
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Gérez et écoutez vos playlists sauvegardées
        </p>
      </div>

      {/* Search Bar and Create Button in Same Row */}
      <div className="mb-4 flex items-center gap-2">
        {/* Mobile: Search Icon Button */}
        {!isSearchExpanded && (
          <button
            onClick={handleSearchIconClick}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Search"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
        )}

        {/* Mobile: Expanded Search / Desktop: Always Visible Search */}
        <div className={`${isSearchExpanded ? 'flex-1' : 'hidden lg:flex flex-1'} relative`}>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher une playlist..."
              value={localSearchValue}
              onChange={(e) => setLocalSearchValue(e.target.value)}
              onBlur={() => {
                // On mobile, collapse search if empty
                if (!localSearchValue.trim() && window.innerWidth < 1024) {
                  setIsSearchExpanded(false);
                }
              }}
              className="block w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 rounded-lg leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 dark:text-gray-100"
            />
            {localSearchValue && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalSearchValue('');
                  setSearchQuery('');
                }}
                className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                type="button"
              >
                <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Create Playlist Button */}
        <div className="flex-shrink-0 ml-auto">
          <button
            onClick={() => router.push('/playlist')}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Créer une playlist</span>
            <span className="sm:hidden">Créer</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {playlists.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center py-12">
            <MusicalNoteIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Aucune playlist sauvegardée
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Créez votre première playlist en cliquant sur le bouton ci-dessus
            </p>
            <button
              onClick={() => router.push('/playlist')}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              Créer une playlist
            </button>
          </div>
        </div>
      ) : showEmptyState ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center py-12">
            <MusicalNoteIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery ? 'Aucune playlist ne correspond à votre recherche' : 'Aucune playlist sauvegardée'}
                      </p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile View - Cards */}
          <div className="block md:hidden space-y-3">
            {sortedPlaylists.map((playlist) => {
              const playlistSongs = playlist.songIds
                .map(id => songs.find(s => s.id === id))
                .filter((song): song is Song => song !== undefined);
              
              return (
                <div
                  key={playlist.id}
                  onClick={() => handleStartSavedPlaylist(playlist)}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {playlist.name}
                      </h3>
                      {playlist.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {playlist.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MusicalNoteIcon className="h-4 w-4 mr-1" />
                      <span>{playlistSongs.length} {playlistSongs.length === 1 ? 'chanson' : 'chansons'}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(playlist.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartSavedPlaylist(playlist);
                    }}
                    className="mt-3 w-full inline-flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm font-medium"
                  >
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Lire la playlist
                  </button>
                </div>
              );
            })}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <SortButton field="name">Nom</SortButton>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <SortButton field="songCount">Chansons</SortButton>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <SortButton field="createdAt">Créé le</SortButton>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedPlaylists.map((playlist) => {
                    const playlistSongs = playlist.songIds
                      .map(id => songs.find(s => s.id === id))
                      .filter((song): song is Song => song !== undefined);
                    
                    return (
                      <tr
                        key={playlist.id}
                        onClick={() => router.push(`/playlist/${playlist.id}`)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {playlist.name}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                            {playlist.description || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MusicalNoteIcon className="h-4 w-4 mr-1" />
                            <span>{playlistSongs.length}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(playlist.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartSavedPlaylist(playlist);
                            }}
                            className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                          >
                            <PlayIcon className="h-4 w-4 mr-1" />
                            {t('common.play')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

