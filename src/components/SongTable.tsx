'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Song, Folder, Playlist } from '@/types';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  MusicalNoteIcon,
  PlayIcon,
  TrashIcon,
  XMarkIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import EditSongForm from './EditSongForm';
import FolderDropdown from './FolderDropdown';
import ColumnConfig from './ColumnConfig';
import SongTableHeader from './song-table/SongTableHeader';
import SongTableRow from './song-table/SongTableRow';
import SongTableEmptyState from './song-table/SongTableEmptyState';

type SortField = 'title' | 'author' | 'createdAt' | 'updatedAt' | 'key' | 'rating' | 'reviews' | 'difficulty' | 'version' | 'viewCount';
type SortDirection = 'asc' | 'desc';

interface SongTableProps {
  songs: Song[];
  folders: Folder[];
  playlists?: Playlist[];
  currentFolder?: string | null;
  currentPlaylistId?: string | null;
  searchQuery?: string;
  hasUser?: boolean;
  onFolderChange: (songId: string, folderId: string | undefined) => Promise<void>;
  onDeleteSongs: (ids: string[]) => Promise<void>;
  onDeleteAllSongs: () => Promise<void>;
  onCurrentFolderChange?: (folderId: string | null) => void;
  onUpdateSong?: (id: string, updates: any) => Promise<any>;
}

export default function SongTable({
  songs,
  folders,
  playlists = [],
  currentFolder = null,
  currentPlaylistId = null,
  searchQuery = '',
  hasUser = false,
  onFolderChange,
  onDeleteSongs,
  onDeleteAllSongs,
  onCurrentFolderChange,
  onUpdateSong
}: SongTableProps) {
  const { t } = useLanguage();
  
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFolderFilter, setShowFolderFilter] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'selected' | 'all' | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['title', 'author', 'key', 'rating', 'viewCount', 'folder']);
  const [showMobileSort, setShowMobileSort] = useState(false);
  const [folderFilterPosition, setFolderFilterPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const folderFilterButtonRef = useRef<HTMLButtonElement>(null);
  const folderFilterMenuRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Calculate folder filter dropdown position
  useEffect(() => {
    if (showFolderFilter && folderFilterButtonRef.current) {
      const rect = folderFilterButtonRef.current.getBoundingClientRect();
      setFolderFilterPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [showFolderFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (folderFilterButtonRef.current && folderFilterMenuRef.current) {
        if (
          showFolderFilter &&
          !folderFilterButtonRef.current.contains(event.target as Node) &&
          !folderFilterMenuRef.current.contains(event.target as Node)
        ) {
          setShowFolderFilter(false);
        }
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowMobileSort(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter songs based on search query and folder/playlist
  const filteredSongs = useMemo(() => {
    let filtered = songs;

    // Filter by playlist if selected
    if (currentPlaylistId) {
      const pl = playlists.find(p => p.id === currentPlaylistId);
      const ids = new Set(pl?.songIds || []);
      filtered = songs.filter(song => ids.has(song.id));
    } else {
      // Filter by folder
      if (currentFolder === 'unorganized') {
        filtered = songs.filter(song => !song.folderId);
      } else if (currentFolder) {
        filtered = songs.filter(song => song.folderId === currentFolder);
      }
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
  }, [songs, searchQuery, currentFolder, currentPlaylistId, playlists]);

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
        case 'key':
          aValue = a.key || '';
          bValue = b.key || '';
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'reviews':
          aValue = a.reviews || 0;
          bValue = b.reviews || 0;
          break;
        case 'difficulty':
          aValue = a.difficulty || '';
          bValue = b.difficulty || '';
          break;
        case 'version':
          aValue = a.version || 0;
          bValue = b.version || 0;
          break;
        case 'viewCount':
          aValue = a.viewCount || 0;
          bValue = b.viewCount || 0;
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

  const handleToggleColumn = (column: string) => {
    setVisibleColumns(prev => {
      if (prev.includes(column)) {
        return prev.filter(col => col !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  const getFolderName = (folderId: string | null | undefined) => {
    if (!folderId) return 'Sans dossier';
   
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Dossier inconnu';
  };


  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setSelectedSong(null);
  };

  const handleFolderChange = async (songId: string, newFolderId: string | undefined) => {
    try {
      await onFolderChange(songId, newFolderId);
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
        await onDeleteAllSongs();
      } else if (deleteType === 'selected') {
        await onDeleteSongs(Array.from(selectedSongs));
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

  // Options de tri pour mobile
  const sortOptions = [
    { field: 'title' as SortField, label: 'Titre', icon: '📝' },
    { field: 'author' as SortField, label: 'Artiste', icon: '👤' },
    { field: 'key' as SortField, label: 'Tonalité', icon: '🎵' },
    { field: 'rating' as SortField, label: 'Note', icon: '⭐' },
    { field: 'reviews' as SortField, label: 'Avis', icon: '👥' },
    { field: 'difficulty' as SortField, label: 'Difficulté', icon: '🎸' },
    { field: 'version' as SortField, label: 'Version', icon: '🔢' },
    { field: 'viewCount' as SortField, label: 'Vues', icon: '👁️' },
    { field: 'updatedAt' as SortField, label: 'Modifié', icon: '📅' },
  ];

  // Don't show empty state if we have songs but they're just filtered out
  const showEmptyState = songs.length === 0;

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      {/* Filter Bar */}
      <div className="px-2 sm:px-6 py-2 sm:py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <SongTableHeader
              sortedSongsCount={sortedSongs.length}
              selectedCount={selectedSongs.size}
              currentFolder={currentFolder}
              searchQuery={searchQuery}
              getFolderName={getFolderName}
              showDeleteAll={selectedSongs.size === sortedSongs.length && sortedSongs.length > 0}
              onCancelSelection={() => setSelectedSongs(new Set())}
              onDeleteSelected={() => handleBulkDelete('selected')}
              onDeleteAll={() => handleBulkDelete('all')}
              t={t}
            />
          </div>
          
          {/* Mobile Controls - Clean Style */}
          <div className="flex flex-wrap gap-1 sm:hidden">
            {/* Quick Filter Buttons */}
            <button
              onClick={() => onCurrentFolderChange?.(null)}
              className={`px-3 py-2 text-sm font-medium rounded-md border transition-all ${
                currentFolder === null
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              Tous
            </button>
            
            <button
              onClick={() => onCurrentFolderChange?.('unorganized')}
              className={`px-3 py-2 text-sm font-medium rounded-md border transition-all ${
                currentFolder === 'unorganized'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              Sans dossier
            </button>
            
            {folders.slice(0, 3).map((folder) => (
              <button
                key={folder.id}
                onClick={() => onCurrentFolderChange?.(folder.id)}
                className={`px-3 py-2 text-sm font-medium rounded-md border transition-all truncate max-w-[120px] ${
                  currentFolder === folder.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
                title={folder.name}
              >
                {folder.name}
              </button>
            ))}
            
            {folders.length > 3 && (
              <button
                onClick={() => setShowFolderFilter(!showFolderFilter)}
                className="px-3 py-2 text-sm font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                +{folders.length - 3}
              </button>
            )}

            {/* Sort Button */}
            <button
              onClick={() => setShowMobileSort(!showMobileSort)}
              className="px-3 py-2 text-sm font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              Trier
            </button>

            {/* Sort Direction Button */}
            {(() => {
              const currentSortOption = sortOptions.find(opt => opt.field === sortField);
              return (
                <button
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 text-sm font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center gap-1.5"
                  title={`Trier ${sortDirection === 'asc' ? 'croissant' : 'décroissant'}`}
                >
                  <span>{currentSortOption?.icon || '📝'}</span>
                  <span className="truncate max-w-[60px]">{currentSortOption?.label || 'Titre'}</span>
                  {sortDirection === 'asc' ? (
                    <ChevronUpIcon className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
                  )}
                </button>
              );
            })()}

            {/* Column Config - Hidden on mobile */}
            <div className="hidden sm:block">
              <ColumnConfig 
                visibleColumns={visibleColumns}
                onToggleColumn={handleToggleColumn}
              />
            </div>
          </div>

          {/* Mobile Dropdowns */}
          {showFolderFilter && (
            <div className="sm:hidden mt-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Autres dossiers</h4>
              <div className="flex flex-wrap gap-2">
                {folders.slice(3).map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      onCurrentFolderChange?.(folder.id);
                      setShowFolderFilter(false);
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-md border transition-all ${
                      currentFolder === folder.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {folder.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showMobileSort && (
            <div className="sm:hidden mt-3 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 relative">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Trier par</h4>
              <div className="grid grid-cols-2 gap-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.field}
                    onClick={() => {
                      handleSort(option.field);
                      setShowMobileSort(false);
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-md border transition-all flex items-center space-x-2 ${
                      sortField === option.field
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{option.icon}</span>
                    <span className="truncate">{option.label}</span>
                    {sortField === option.field && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="h-4 w-4 ml-auto" /> : 
                        <ChevronDownIcon className="h-4 w-4 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Folder Filter Dropdown */}
            <div className="relative">
              <button
                ref={folderFilterButtonRef}
                onClick={() => setShowFolderFilter(!showFolderFilter)}
                className="inline-flex items-center justify-between px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-auto"
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

              {showFolderFilter && typeof window !== 'undefined' && createPortal(
                <>
                  {/* Overlay */}
                  <div 
                    className="fixed inset-0 z-[100]" 
                    onClick={() => setShowFolderFilter(false)}
                  />
                  {/* Menu */}
                  <div 
                    ref={folderFilterMenuRef}
                    className="fixed w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[101]"
                    style={{
                      top: `${folderFilterPosition.top}px`,
                      right: `${folderFilterPosition.right}px`
                    }}
                  >
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onCurrentFolderChange?.(null);
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
                          onCurrentFolderChange?.('unorganized');
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
                            onCurrentFolderChange?.(folder.id);
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
                </>,
                document.body
              )}
            </div>
            
            {/* Column Configuration */}
            <ColumnConfig 
              visibleColumns={visibleColumns}
              onToggleColumn={handleToggleColumn}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Checkbox column - Only show if user is logged in */}
              {hasUser && (
                <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-12">
                  <input
                    type="checkbox"
                    checked={selectedSongs.size === sortedSongs.length && sortedSongs.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-5 w-5 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                </th>
              )}
              <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="title">{t('songs.title')}</SortButton>
              </th>
              {visibleColumns.includes('author') && (
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="author">{t('songs.artist')}</SortButton>
                </th>
              )}
              {visibleColumns.includes('key') && (
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="key">🎵 Key</SortButton>
                </th>
              )}
              {visibleColumns.includes('rating') && (
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="rating">⭐ Rating</SortButton>
                </th>
              )}
              {visibleColumns.includes('reviews') && (
                <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="reviews">👥 Reviews</SortButton>
                </th>
              )}
              {visibleColumns.includes('difficulty') && (
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="difficulty">🎸 Difficulty</SortButton>
                </th>
              )}
               {visibleColumns.includes('version') && (
                 <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   <SortButton field="version">🔢 Version</SortButton>
                 </th>
               )}
               {visibleColumns.includes('viewCount') && (
                 <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   <SortButton field="viewCount">👁️ Vues</SortButton>
                 </th>
               )}
              {visibleColumns.includes('folder') && (
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('songs.folder')}
                </th>
              )}
              {visibleColumns.includes('updatedAt') && (
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="updatedAt">{t('songs.modified')}</SortButton>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedSongs.length === 0 ? (
              <SongTableEmptyState
                currentFolder={currentFolder}
                searchQuery={searchQuery}
                getFolderName={getFolderName}
                onResetFilters={() => onCurrentFolderChange?.(null)}
                visibleColumnsCount={visibleColumns.length}
                hasUser={hasUser}
              />
            ) : (
              sortedSongs.map((song) => (
                <SongTableRow
                  key={song.id}
                  song={song}
                  folders={folders}
                  visibleColumns={visibleColumns}
                  isSelected={selectedSongs.has(song.id)}
                  onSelect={(checked) => handleSelectSong(song.id, checked)}
                  onFolderChange={handleFolderChange}
                  hasUser={hasUser}
                  t={t}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Song Modal */}
      <EditSongForm 
        isOpen={showEditForm}
        onClose={handleCloseEditForm}
        song={selectedSong}
        folders={folders}
        onUpdate={onUpdateSong || (async () => {})}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 max-w-[90vw] shadow-lg rounded-md bg-white">
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
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-4">
                <button
                  onClick={cancelBulkDelete}
                  className="px-6 py-3 sm:px-4 sm:py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-lg shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 min-h-[52px] sm:min-h-0"
                >
                  {t('songs.cancel')}
                </button>
                <button
                  onClick={confirmBulkDelete}
                  className="px-6 py-3 sm:px-4 sm:py-2 bg-red-600 text-white text-base font-medium rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[52px] sm:min-h-0"
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
