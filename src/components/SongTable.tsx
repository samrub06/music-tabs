'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Song, Folder, Playlist } from '@/types';
import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useState } from 'react';
import EditSongForm from './EditSongForm';
import SongTableHeader from './song-table/SongTableHeader';
import SongTableRow from './song-table/SongTableRow';
import SongTableEmptyState from './song-table/SongTableEmptyState';
import MoveToFolderModal from './MoveToFolderModal';
import Snackbar from './Snackbar';

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
  // External sort state (optional - for backward compatibility)
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSortChange?: (field: SortField, direction: SortDirection) => void;
  // Select mode props
  isSelectMode?: boolean;
  onToggleSelectMode?: () => void;
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
  onUpdateSong,
  sortField: externalSortField,
  sortDirection: externalSortDirection,
  onSortChange,
  isSelectMode: externalIsSelectMode,
  onToggleSelectMode: externalOnToggleSelectMode
}: SongTableProps) {
  const { t } = useLanguage();
  
  // Use external sort state if provided, otherwise use internal state
  const [internalSortField, setInternalSortField] = useState<SortField>('title');
  const [internalSortDirection, setInternalSortDirection] = useState<SortDirection>('asc');
  
  const sortField = externalSortField ?? internalSortField;
  const sortDirection = externalSortDirection ?? internalSortDirection;
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'selected' | 'all' | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['title', 'author', 'key', 'rating', 'viewCount', 'folder']);
  
  // Use external select mode if provided, otherwise default to false
  const isSelectMode = externalIsSelectMode ?? false;
  
  // Ensure 'title' is always in visibleColumns (required column)
  useEffect(() => {
    setVisibleColumns(prev => {
      if (!prev.includes('title')) {
        return [...prev, 'title'];
      }
      return prev;
    });
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

  const getFolderName = (folderId: string | null | undefined) => {
    if (!folderId) return t('songs.unorganized');
   
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : t('songs.unknownFolder');
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

  // Handle bulk move to folder
  const handleBulkMove = async (folderId: string | undefined) => {
    try {
      const songIds = Array.from(selectedSongs);
      const count = songIds.length;
      // Move all selected songs to the folder
      await Promise.all(songIds.map(songId => onFolderChange(songId, folderId)));
      
      // Find folder name for success message
      const folderName = folderId 
        ? folders.find(f => f.id === folderId)?.name || t('songs.theFolder')
        : t('songs.unorganized')
      
      const message = count === 1 
        ? `1 ${t('songs.songMoved')} ${t('songs.inFolder')} ${folderName}`
        : t('songs.songsMoved').replace('{count}', String(count)) + ` ${t('songs.inFolder')} ${folderName}`
      setSuccessMessage(message)
      
      // Clear selection after successful move
      setSelectedSongs(new Set());
    } catch (error) {
      console.error('Error moving songs:', error);
      // Show error to user
      alert(t('songs.moveError'));
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

  // Clear selected songs when select mode is turned off
  useEffect(() => {
    if (!isSelectMode) {
      setSelectedSongs(new Set());
    }
  }, [isSelectMode]);

  return (
    <div>
      {selectedSongs.size > 0 && (
        <div className="border-b border-border bg-muted/40 px-4 py-3 sm:px-6">
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
            onMoveToFolder={selectedSongs.size > 0 ? () => setShowMoveModal(true) : undefined}
            isSelectMode={isSelectMode}
            onToggleSelectMode={externalOnToggleSelectMode || (() => {})}
            t={t}
          />
        </div>
      )}

      {hasUser && isSelectMode && sortedSongs.length > 0 && (
        <div className="flex items-center border-b border-border px-4 py-2 sm:px-6">
          <input
            type="checkbox"
            checked={selectedSongs.size === sortedSongs.length && sortedSongs.length > 0}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:h-4 sm:w-4"
            aria-label={t('songs.selected')}
          />
        </div>
      )}

      <ul className="divide-y divide-border">
        {sortedSongs.length === 0 ? (
          <SongTableEmptyState
            currentFolder={currentFolder}
            searchQuery={searchQuery}
            getFolderName={getFolderName}
            onResetFilters={() => onCurrentFolderChange?.(null)}
          />
        ) : (
          sortedSongs.map((song) => (
            <SongTableRow
              key={song.id}
              song={song}
              songs={sortedSongs}
              folders={folders}
              visibleColumns={visibleColumns}
              isSelected={selectedSongs.has(song.id)}
              onSelect={(checked) => handleSelectSong(song.id, checked)}
              onFolderChange={handleFolderChange}
              hasUser={hasUser}
              isSelectMode={isSelectMode}
              t={t}
            />
          ))
        )}
      </ul>

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
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 max-w-[90vw] shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">
                {deleteType === 'all' ? t('songs.confirmDeleteAll') : t('songs.confirmDeleteSelected')}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
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

      {/* Move to Folder Modal */}
      <MoveToFolderModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        folders={folders}
        onMove={handleBulkMove}
        songCount={selectedSongs.size}
      />

      {/* Success Snackbar */}
      <Snackbar
        message={successMessage || ''}
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        type="success"
        duration={3000}
      />
    </div>
  );
}
