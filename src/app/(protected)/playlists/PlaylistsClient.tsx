'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SparklesIcon, MusicalNoteIcon, PlayIcon, MagnifyingGlassIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Song, Playlist } from '@/types';

type SortField = 'name' | 'songCount' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface PlaylistsClientProps {
  songs: Song[];
  playlists: Playlist[];
}

export default function PlaylistsClient({ songs, playlists }: PlaylistsClientProps) {
  const router = useRouter();
  const [localSearchValue, setLocalSearchValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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
      {/* Header with Create Button */}
      <div className="mb-4 sm:mb-6 flex items-start justify-between gap-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Playlists
          </h1>
          <p className="text-sm text-gray-600">
            Gérez et écoutez vos playlists sauvegardées
          </p>
        </div>
        {/* Create Playlist Button */}
        <div className="flex-shrink-0">
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

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher une playlist..."
            value={localSearchValue}
            onChange={(e) => setLocalSearchValue(e.target.value)}
            className="block w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {localSearchValue && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLocalSearchValue('');
                setSearchQuery('');
              }}
              className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-400 hover:text-gray-600"
              type="button"
            >
              <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Playlists Table */}
      {playlists.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <MusicalNoteIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune playlist sauvegardée
            </h3>
            <p className="text-gray-500 mb-4">
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
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="name">Nom</SortButton>
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="songCount">Chansons</SortButton>
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="createdAt">Créé le</SortButton>
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {showEmptyState ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <MusicalNoteIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        {searchQuery ? 'Aucune playlist ne correspond à votre recherche' : 'Aucune playlist sauvegardée'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedPlaylists.map((playlist) => {
                    const playlistSongs = playlist.songIds
                      .map(id => songs.find(s => s.id === id))
                      .filter((song): song is Song => song !== undefined);
                    
                    return (
                      <tr
                        key={playlist.id}
                        onClick={() => handleStartSavedPlaylist(playlist)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {playlist.name}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-4">
                          <div className="text-sm text-gray-600 truncate max-w-xs">
                            {playlist.description || '-'}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <MusicalNoteIcon className="h-4 w-4 mr-1" />
                            <span>{playlistSongs.length}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(playlist.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartSavedPlaylist(playlist);
                            }}
                            className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                          >
                            <PlayIcon className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Lire</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

