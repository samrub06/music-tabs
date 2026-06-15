'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Song, Folder, Playlist } from '@/types';
import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { getSelectableSongIdsAction } from '@/app/(protected)/dashboard/actions';
import type { SelectableSongIdsInput } from '@/lib/validation/schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import EditSongForm from './EditSongForm';
import { SongBulkActions } from './song-table/SongTableHeader';
import SongTableRow from './song-table/SongTableRow';
import SongTableEmptyState from './song-table/SongTableEmptyState';
import MoveToFolderModal from './MoveToFolderModal';
import CreatePlaylistModal from './CreatePlaylistModal';
import Snackbar from './Snackbar';
import { addFolderAction } from '@/app/(protected)/dashboard/actions';
import { createPlaylistWithSongsAction } from '@/app/(protected)/ai-playlist/actions';
import { useRouter } from 'next/navigation';

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
  totalMatchingCount?: number;
  selectionFilters?: SelectableSongIdsInput;
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
  onToggleSelectMode: externalOnToggleSelectMode,
  totalMatchingCount,
  selectionFilters,
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
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'selected' | 'all' | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
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

  const handleBulkCreateFolderAndMove = async (folderName: string) => {
    try {
      const created = await addFolderAction(folderName);
      const songIds = Array.from(selectedSongs);
      await Promise.all(songIds.map((songId) => onFolderChange(songId, created.id)));
      const message =
        songIds.length === 1
          ? `1 ${t('songs.songMoved')} ${t('songs.inFolder')} ${created.name}`
          : t('songs.songsMoved').replace('{count}', String(songIds.length)) +
            ` ${t('songs.inFolder')} ${created.name}`;
      setSuccessMessage(message);
      setSelectedSongs(new Set());
      router.refresh();
    } catch (error) {
      console.error('Error creating folder and moving songs:', error);
      alert(t('songs.moveError'));
      throw error;
    }
  };

  const handleBulkCreatePlaylist = async (name: string, coverSlug?: string) => {
    const songIds = Array.from(selectedSongs);
    if (songIds.length === 0) return;
    try {
      const playlist = await createPlaylistWithSongsAction(name, '', songIds, coverSlug);
      setSuccessMessage(t('songs.playlistCreated'));
      setSelectedSongs(new Set());
      router.push(`/playlist/${playlist.id}`);
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert(t('songs.playlistCreateError'));
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

  const matchTotal = totalMatchingCount ?? sortedSongs.length;
  const allMatchingSelected =
    matchTotal > 0 && selectedSongs.size >= matchTotal;
  const someMatchingSelected =
    selectedSongs.size > 0 && selectedSongs.size < matchTotal;

  const handleSelectAll = async (checked: boolean) => {
    if (!checked) {
      setSelectedSongs(new Set());
      return;
    }

    if (!selectionFilters || matchTotal <= sortedSongs.length) {
      setSelectedSongs(new Set(sortedSongs.map((song) => song.id)));
      return;
    }

    setIsSelectingAll(true);
    try {
      const ids = await getSelectableSongIdsAction(selectionFilters);
      setSelectedSongs(new Set(ids));
    } catch (error) {
      console.error('Error selecting all songs:', error);
      alert(t('songs.selectAllError'));
    } finally {
      setIsSelectingAll(false);
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
      {hasUser && isSelectMode && sortedSongs.length > 0 && (
        <div className="border-b border-border">
          <div className="flex items-center justify-between gap-3 px-4 py-2 sm:gap-3 sm:py-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSelectingAll}
              aria-pressed={allMatchingSelected}
              onClick={() =>
                void handleSelectAll(allMatchingSelected ? false : true)
              }
              className={cn(
                'h-8 shrink-0',
                allMatchingSelected && 'border-primary bg-primary/5',
                someMatchingSelected && !allMatchingSelected && 'border-primary/60'
              )}
            >
              {t('songs.all')}
            </Button>
            {selectedSongs.size > 0 ? (
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs font-medium text-primary whitespace-nowrap sm:text-sm">
                  {selectedSongs.size === 1
                    ? `1 ${t('songs.songCount')} ${t('songs.selected')}`
                    : `${selectedSongs.size} ${t('songs.songCountPlural')} ${t('songs.selected')}`}
                </span>
                <SongBulkActions
                  showDeleteAll={false}
                  onCancelSelection={() => setSelectedSongs(new Set())}
                  onDeleteSelected={() => handleBulkDelete('selected')}
                  onDeleteAll={() => handleBulkDelete('all')}
                  onMoveToFolder={() => setShowMoveModal(true)}
                  onCreatePlaylist={() => setShowPlaylistModal(true)}
                  t={t}
                />
              </div>
            ) : (
              <span className="shrink-0 text-sm text-muted-foreground">
                {t('songs.selectSongsHint')}
              </span>
            )}
          </div>
        </div>
      )}

      <ul>
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

      <Dialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) cancelBulkDelete();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {deleteType === 'all'
                ? t('songs.confirmDeleteAll')
                : t('songs.confirmDeleteSelected')}
            </DialogTitle>
            <DialogDescription>
              {deleteType === 'all'
                ? t('songs.confirmDeleteAllMessage')
                : t('songs.confirmDeleteSelectedMessage').replace(
                    '{count}',
                    String(selectedSongs.size)
                  )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={cancelBulkDelete} className="min-h-11 sm:min-h-9">
              {t('songs.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmBulkDelete()}
              className="min-h-11 sm:min-h-9"
            >
              {t('songs.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Modal */}
      <MoveToFolderModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        folders={folders}
        onMove={handleBulkMove}
        onCreateFolderAndMove={handleBulkCreateFolderAndMove}
        songCount={selectedSongs.size}
      />

      <CreatePlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        songCount={selectedSongs.size}
        onCreate={handleBulkCreatePlaylist}
        songs={songs.filter((song) => selectedSongs.has(song.id))}
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
