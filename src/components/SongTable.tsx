'use client';

import { useApp } from '@/context/AppContext';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Song } from '@/types';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  MusicalNoteIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import EditSongForm from './EditSongForm';
import FolderDropdown from './FolderDropdown';

type SortField = 'title' | 'author' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export default function SongTable() {
  const { 
    songs, 
    folders,
    searchQuery, 
    deleteSong,
    deleteSongs,
    deleteAllSongs,
    updateSongFolder,
    currentFolder,
    setCurrentFolder
  } = useApp();
  const { user } = useAuthContext();
  const { t } = useLanguage();
  const router = useRouter();
  
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFolderFilter, setShowFolderFilter] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'selected' | 'all' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFolderFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter songs based on search query and folder
  const filteredSongs = useMemo(() => {
    let filtered = songs;

    // Filter by folder
    if (currentFolder === 'unorganized') {
      filtered = songs.filter(song => !song.folderId);
    } else if (currentFolder) {
      filtered = songs.filter(song => song.folderId === currentFolder);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(song => 
        song.title.toLowerCase().includes(query) ||
        song.author.toLowerCase().includes(query) ||
        // Search in all sections and lines for structured songs
        song.sections?.some(section => 
          section.name.toLowerCase().includes(query) ||
          section.lines.some(line => 
            line.lyrics?.toLowerCase().includes(query) ||
            line.chords?.some(chord => chord.chord.toLowerCase().includes(query))
          )
        )
      );
    }

    return filtered;
  }, [songs, searchQuery, currentFolder]);

  // Sort songs
  const sortedSongs = useMemo(() => {
    return [...filteredSongs].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'author':
          aValue = a.author.toLowerCase();
          bValue = b.author.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSongs, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFolderName = (folderId: string | null | undefined) => {
    if (!folderId) return 'Sans dossier';
   
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Dossier inconnu';
  };

  const handleDeleteSong = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer cette chanson ?')) {
      deleteSong(songId);
    }
  };

  const handleEditSong = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    setSelectedSong(song);
    setShowEditForm(true);
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setSelectedSong(null);
  };

  const handleFolderChange = async (songId: string, newFolderId: string | undefined) => {
    try {
      await updateSongFolder(songId, newFolderId);
    } catch (error) {
      console.error('Error updating song folder:', error);
      throw error;
    }
  };

  // Handle song selection
  const handleSelectSong = (songId: string, checked: boolean) => {
    const newSelectedSongs = new Set(selectedSongs);
    if (checked) {
      newSelectedSongs.add(songId);
    } else {
      newSelectedSongs.delete(songId);
    }
    setSelectedSongs(newSelectedSongs);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allSongIds = new Set(sortedSongs.map(song => song.id));
      setSelectedSongs(allSongIds);
    } else {
      setSelectedSongs(new Set());
    }
  };

  // Handle bulk delete
  const handleBulkDelete = (type: 'selected' | 'all') => {
    setDeleteType(type);
    setShowDeleteConfirm(true);
  };

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    try {
      if (deleteType === 'all') {
        await deleteAllSongs();
      } else if (deleteType === 'selected') {
        await deleteSongs(Array.from(selectedSongs));
      }
      setSelectedSongs(new Set());
    } catch (error) {
      console.error('Error deleting songs:', error);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteType(null);
    }
  };

  // Cancel bulk delete
  const cancelBulkDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteType(null);
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

  if (sortedSongs.length === 0) {
    return (
      <div className="text-center py-12">
        <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {searchQuery ? t('songs.noSongs') : t('songs.noSongs')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchQuery ? t('songs.tryDifferentSearch') : t('songs.startAdding')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      {/* Filter Bar */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            {selectedSongs.size > 0 ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-700">
                  {selectedSongs.size} {selectedSongs.size !== 1 ? t('songs.songCountPlural') : t('songs.songCount')} {t('songs.selected')}
                </span>
                <button
                  onClick={() => handleBulkDelete('selected')}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-1.5" />
                  {t('songs.deleteSelected')}
                </button>
                <button
                  onClick={() => handleBulkDelete('all')}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-1.5" />
                  {t('songs.deleteAll')}
                </button>
                <button
                  onClick={() => setSelectedSongs(new Set())}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <XMarkIcon className="h-4 w-4 mr-1.5" />
                  {t('songs.cancel')}
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium text-gray-700">
                  {sortedSongs.length} {sortedSongs.length !== 1 ? t('songs.songCountPlural') : t('songs.songCount')}
                </span>
                {currentFolder && (
                  <span className="text-sm text-gray-500">
                    {t('songs.inFolder')} {getFolderName(currentFolder)}
                  </span>
                )}
              </>
            )}
          </div>
          
          {/* Folder Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowFolderFilter(!showFolderFilter)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto justify-between"
            >
              <div className="flex items-center">
                <FunnelIcon className="h-4 w-4 mr-2" />
                <span className="truncate">
                  {currentFolder === null ? t('songs.allFolders') : 
                   currentFolder === 'unorganized' ? t('songs.unorganized') : 
                   getFolderName(currentFolder)}
                </span>
              </div>
              <ChevronDownIcon className="h-4 w-4 ml-2 flex-shrink-0" />
            </button>

            {showFolderFilter && (
              <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-full sm:w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setCurrentFolder(null);
                      setShowFolderFilter(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      currentFolder === null
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('songs.allSongs')}
                  </button>
                  <button
                    onClick={() => {
                      setCurrentFolder('unorganized');
                      setShowFolderFilter(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      currentFolder === 'unorganized'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('songs.unorganized')}
                  </button>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setCurrentFolder(folder.id);
                        setShowFolderFilter(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        currentFolder === folder.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {folder.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Checkbox column - Only show if user is logged in */}
              {user && (
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectedSongs.size === sortedSongs.length && sortedSongs.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
              )}
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="title">{t('songs.title')}</SortButton>
              </th>
              <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="author">{t('songs.artist')}</SortButton>
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('songs.folder')}
              </th>
              <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="updatedAt">{t('songs.modified')}</SortButton>
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('songs.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedSongs.map((song) => (
              <tr
                key={song.id}
                onClick={() => router.push(`/song/${song.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {/* Checkbox column - Only show if user is logged in */}
                {user && (
                  <td 
                    className="px-3 sm:px-6 py-4 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSongs.has(song.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectSong(song.id, e.target.checked);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                )}
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <MusicalNoteIcon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[180px] sm:max-w-none">
                        {song.title}
                      </div>
                      {/* Show artist on mobile when artist column is hidden */}
                      <div className="sm:hidden text-xs text-gray-500 truncate max-w-[180px]">
                        <div className="flex items-center space-x-2">
                          <span>{song.author}</span>
                          {song.capo && (
                            <>
                              <span className="text-gray-300">•</span>
                              <div className="flex items-center space-x-1">
                                <span className="text-blue-600 font-medium">🎸</span>
                                <span className="text-blue-600 font-medium">Capo {song.capo}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 truncate max-w-xs">
                    <div className="flex items-center space-x-2">
                      <span>{song.author}</span>
                      {song.capo && (
                        <>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-blue-600 font-medium">🎸</span>
                            <span className="text-blue-600 font-medium">Capo {song.capo}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                  <div onClick={(e) => e.stopPropagation()}>
                    <FolderDropdown
                      currentFolderId={song.folderId}
                      folders={folders}
                      onFolderChange={(newFolderId) => handleFolderChange(song.id, newFolderId)}
                      disabled={!user} // Seulement les utilisateurs connectés peuvent changer les dossiers
                    />
                  </div>
                </td>
                <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(song.updatedAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/song/${song.id}`);
                      }}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      title={t('songs.open')}
                    >
                      <PlayIcon className="h-4 w-4" />
                    </button>
                    {/* Boutons Edit et Delete visibles uniquement si connecté */}
                    {user && (
                      <>
                        <button
                          onClick={(e) => handleEditSong(e, song)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title={t('songs.edit')}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSong(e, song.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title={t('songs.delete')}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Song Modal */}
      <EditSongForm 
        isOpen={showEditForm}
        onClose={handleCloseEditForm}
        song={selectedSong}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                {deleteType === 'all' ? t('songs.confirmDeleteAll') : t('songs.confirmDeleteSelected')}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  {deleteType === 'all' 
                    ? t('songs.confirmDeleteAllMessage')
                    : t('songs.confirmDeleteSelectedMessage').replace('{count}', selectedSongs.size.toString())
                  }
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={cancelBulkDelete}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  {t('songs.cancel')}
                </button>
                <button
                  onClick={confirmBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {t('songs.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
