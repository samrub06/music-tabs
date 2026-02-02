'use client';

import { useLanguage } from '@/context/LanguageContext';
import {
    FolderIcon,
    FolderOpenIcon,
    MusicalNoteIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
    ClockIcon,
    FireIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Song, Folder, Playlist } from '@/types';
import { addFolderAction, renameFolderAction, deleteFolderAction } from '@/app/(protected)/dashboard/actions';
import { useDroppable } from '@dnd-kit/core';
import React from 'react';

interface DashboardSidebarProps {
  songs: Song[];
  folders: Folder[];
  playlists: Playlist[];
  currentFolder: string | null;
  onFolderChange: (folderId: string | null) => void;
  onClose?: () => void;
  onMoveSong?: (songId: string, folderId: string | undefined) => Promise<void>;
  onCreateClick?: () => void;
}

// Component for droppable folder
function DroppableFolder({ 
  folderId, 
  folderName, 
  songCount, 
  isActive, 
  onFolderChange, 
  onClose,
  children 
}: { 
  folderId: string | null; 
  folderName: string; 
  songCount: number; 
  isActive: boolean; 
  onFolderChange: (folderId: string | null) => void; 
  onClose?: () => void;
  children: React.ReactNode;
}) {
  const dropId = folderId ? `folder-${folderId}` : 'folder-null';
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
        isOver
          ? 'bg-blue-200 border-2 border-blue-500 border-dashed scale-105 shadow-lg'
          : isActive
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {children}
    </div>
  );
}

export default function DashboardSidebar({ 
  songs, 
  folders, 
  playlists,
  currentFolder, 
  onFolderChange,
  onClose,
  onMoveSong,
  onCreateClick
}: DashboardSidebarProps) {
  const { t } = useLanguage();
  const router = useRouter();

  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'popular'>('all');

  const handleAddFolder = async () => {
    if (newFolderName.trim()) {
      await addFolderAction(newFolderName.trim());
      setNewFolderName('');
      setShowAddForm(false);
    }
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder.id);
    setEditName(folder.name);
  };

  const handleSaveEdit = async () => {
    if (editingFolder && editName.trim()) {
      await renameFolderAction(editingFolder, editName.trim());
      setEditingFolder(null);
      setEditName('');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (confirm(t('sidebar.confirmDeleteFolder'))) {
      await deleteFolderAction(folderId);
    }
  };

  const getSongCountByFolder = (folderId: string | null) => {
    return songs.filter(song => song.folderId === folderId).length;
  };

  const unorganizedSongs = getSongCountByFolder(null);

  const recentSongs = useMemo(() => {
    return [...songs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [songs]);

  const popularSongs = useMemo(() => {
    return [...songs]
      .filter(song => song.viewCount && song.viewCount > 0)
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 10);
  }, [songs]);

  // Sort folders by displayOrder
  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      const orderA = a.displayOrder ?? Infinity;
      const orderB = b.displayOrder ?? Infinity;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // If displayOrder is the same or both undefined, sort by createdAt as fallback
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [folders]);

  return (
    <aside className="w-72 bg-white dark:bg-gray-900 shadow-sm border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
      <div className="p-4">
        {/* Add Song Button - Desktop only */}
        {onCreateClick && (
          <div className="mb-4 hidden lg:block">
            <button
              onClick={() => {
                onCreateClick();
                onClose?.();
              }}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-200 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg hover:bg-blue-300 dark:hover:bg-blue-900/50 transition-colors shadow-sm"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter une chanson
            </button>
          </div>
        )}

        {/* Create Playlist Button */}
        <div className="mb-4">
          <button
            onClick={() => {
              router.push('/playlist');
              onClose?.();
            }}
            className="w-full flex items-center justify-center px-4 py-3 bg-purple-200 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-lg hover:bg-purple-300 dark:hover:bg-purple-900/50 transition-colors shadow-sm"
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            Créer une playlist
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'all' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <MusicalNoteIcon className="h-4 w-4 mr-2" />
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'recent' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <ClockIcon className="h-4 w-4 mr-2" />
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'popular' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <FireIcon className="h-4 w-4 mr-2" />
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'all' && (
          <>
            {/* All Songs */}
            <div className="space-y-1">
              <DroppableFolder
                folderId={null}
                folderName={t('sidebar.allSongs')}
                songCount={songs.length}
                isActive={currentFolder === null}
                onFolderChange={onFolderChange}
                onClose={onClose}
              >
                <button
                  onClick={() => {
                    onFolderChange(null);
                    onClose?.();
                  }}
                  className="flex-1 flex items-center text-left w-full"
                >
                  <MusicalNoteIcon className="mr-3 h-5 w-5" />
                  {t('sidebar.allSongs')}
                </button>
                <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                  {songs.length}
                </span>
              </DroppableFolder>

              {unorganizedSongs > 0 && (
                <DroppableFolder
                  folderId={null}
                  folderName={t('sidebar.unorganizedSongs')}
                  songCount={unorganizedSongs}
                  isActive={currentFolder === 'unorganized'}
                  onFolderChange={onFolderChange}
                  onClose={onClose}
                >
                  <button
                    onClick={() => {
                      onFolderChange('unorganized');
                      onClose?.();
                    }}
                    className="flex-1 flex items-center text-left w-full"
                  >
                    <FolderIcon className="mr-3 h-5 w-5" />
                    {t('sidebar.unorganizedSongs')}
                  </button>
                  <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                    {unorganizedSongs}
                  </span>
                </DroppableFolder>
              )}
            </div>

            {/* Folders */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t('sidebar.folders')}
                </h3>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                  title={t('sidebar.addFolder')}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>

              {showAddForm && (
                <div className="mb-3 p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                  <input
                    type="text"
                    placeholder={t('sidebar.folderName')}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleAddFolder();
                      if (e.key === 'Escape') {
                        setShowAddForm(false);
                        setNewFolderName('');
                      }
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <div className="flex justify-end space-x-1 mt-2">
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewFolderName('');
                      }}
                      className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      {t('sidebar.cancel')}
                    </button>
                    <button
                      onClick={handleAddFolder}
                      disabled={!newFolderName.trim()}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {t('sidebar.create')}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {sortedFolders.map((folder) => (
                  <DroppableFolder
                    key={folder.id}
                    folderId={folder.id}
                    folderName={folder.name}
                    songCount={getSongCountByFolder(folder.id)}
                    isActive={currentFolder === folder.id}
                    onFolderChange={onFolderChange}
                    onClose={onClose}
                  >
                    {editingFolder === folder.id ? (
                      <div className="flex-1 flex items-center space-x-1">
                        <FolderOpenIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') {
                              setEditingFolder(null);
                              setEditName('');
                            }
                          }}
                          onBlur={handleSaveEdit}
                          className="flex-1 px-1 py-0 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            onFolderChange(folder.id);
                            onClose?.();
                          }}
                          className="flex-1 flex items-center text-left"
                        >
                          {currentFolder === folder.id ? (
                            <FolderOpenIcon className="mr-3 h-5 w-5" />
                          ) : (
                            <FolderIcon className="mr-3 h-5 w-5" />
                          )}
                          <span className="truncate">{folder.name}</span>
                        </button>
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full mr-2">
                          {getSongCountByFolder(folder.id)}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFolder(folder);
                            }}
                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                            title={t('sidebar.rename')}
                          >
                            <PencilIcon className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder.id);
                            }}
                            className="p-1 text-red-400 hover:text-red-600 rounded"
                            title={t('sidebar.delete')}
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </DroppableFolder>
                ))}
              </div>

              {sortedFolders.length === 0 && !showAddForm && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t('sidebar.noFolders')}</p>
              )}
            </div>

            {/* Playlists */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {t('navigation.playlists')}
              </h3>
              {playlists.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t('folders.noPlaylist')}</p>
              ) : (
                <div className="space-y-1">
                  {playlists.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        router.push('/songs');
                        onClose?.();
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <MusicalNoteIcon className="mr-3 h-5 w-5" />
                      <span className="truncate flex-1 text-left">{p.name}</span>
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                        {p.songIds?.length || 0}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Recent Songs Tab */}
        {activeTab === 'recent' && (
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              {t('search.recentSongs')}
            </h3>
            {recentSongs.length > 0 ? (
              recentSongs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => {
                    router.push(`/song/${song.id}`);
                    onClose?.();
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-100"
                >
                  <MusicalNoteIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <div className="truncate font-medium">{song.title}</div>
                    <div className="truncate text-xs text-gray-500">{song.author}</div>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">{t('folders.noRecentSongs')}</p>
            )}
          </div>
        )}

        {/* Popular Songs Tab */}
        {activeTab === 'popular' && (
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              {t('search.popularSongs')}
            </h3>
            {popularSongs.length > 0 ? (
              popularSongs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => {
                    router.push(`/song/${song.id}`);
                    onClose?.();
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-100"
                >
                  <MusicalNoteIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <div className="truncate font-medium">{song.title}</div>
                    <div className="truncate text-xs text-gray-500">{song.author}</div>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">{t('folders.noViewData')}</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

