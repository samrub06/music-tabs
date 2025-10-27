'use client';

import { useApp } from '@/context/AppContext';
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

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { 
    folders, 
    songs, 
    playlists,
    currentFolder, 
    setCurrentFolder,
    setCurrentSong,
    addFolder,
    updateFolder,
    deleteFolder
  } = useApp();
  const { t } = useLanguage();
  const router = useRouter();

  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'popular'>('all');

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder({ name: newFolderName.trim() });
      setNewFolderName('');
      setShowAddForm(false);
    }
  };

  const handleEditFolder = (folder: any) => {
    setEditingFolder(folder.id);
    setEditName(folder.name);
  };

  const handleSaveEdit = () => {
    if (editingFolder && editName.trim()) {
      updateFolder(editingFolder, { name: editName.trim() });
      setEditingFolder(null);
      setEditName('');
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    if (confirm(t('sidebar.confirmDeleteFolder'))) {
      deleteFolder(folderId);
    }
  };

  const getSongCountByFolder = (folderId: string | null) => {
    return songs.filter(song => song.folderId === folderId).length;
  };

  const unorganizedSongs = getSongCountByFolder(null);

  // Calculer les chansons récentes (dernières 10 ajoutées)
  const recentSongs = useMemo(() => {
    return [...songs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [songs]);

  // Calculer les chansons populaires (les plus vues)
  const popularSongs = useMemo(() => {
    return [...songs]
      .filter(song => song.viewCount && song.viewCount > 0)
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 10);
  }, [songs]);

  return (
    <aside className="w-72 bg-white shadow-sm border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
          {/* Create Medley Button */}
          <div className="mb-4">
          <button
            onClick={() => {
              router.push('/medley');
              onClose?.();
            }}
            className="w-full flex items-center justify-center px-4 py-3 bg-purple-200 border border-purple-300 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-300 transition-colors shadow-sm"
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            Créer un medley
          </button>
        </div>
        {/* Tabs */}
        <div className="mb-4">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MusicalNoteIcon className="h-4 w-4 mr-2" />
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'recent'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'popular'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
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
          <button
            onClick={() => {
              setCurrentFolder(null);
              setCurrentSong(null); // Close song view when changing folder
              onClose?.();
            }}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              currentFolder === null
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MusicalNoteIcon className="mr-3 h-5 w-5" />
            {t('sidebar.allSongs')}
            <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
              {songs.length}
            </span>
          </button>

          {/* Unorganized Songs */}
          {unorganizedSongs > 0 && (
            <button
              onClick={() => {
                setCurrentFolder('unorganized');
                setCurrentSong(null); // Close song view when changing folder
                onClose?.();
              }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentFolder === 'unorganized'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FolderIcon className="mr-3 h-5 w-5" />
              {t('sidebar.unorganizedSongs')}
              <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                {unorganizedSongs}
              </span>
            </button>
          )}
        </div>

        {/* Folders */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {t('sidebar.folders')}
            </h3>
            <button
              onClick={() => setShowAddForm(true)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title={t('sidebar.addFolder')}
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Add Folder Form */}
          {showAddForm && (
            <div className="mb-3 p-2 border border-gray-200 rounded-md bg-gray-50">
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
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
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

          {/* Folder List */}
          <div className="space-y-1">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentFolder === folder.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
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
                        setCurrentFolder(folder.id);
                        setCurrentSong(null); // Close song view when changing folder
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
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full mr-2">
                      {getSongCountByFolder(folder.id)}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFolder(folder);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title={t('sidebar.rename')}
                      >
                        <PencilIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title={t('sidebar.delete')}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {folders.length === 0 && !showAddForm && (
            <p className="text-sm text-gray-500 italic">
              {t('sidebar.noFolders')}
            </p>
          )}
        </div>

        {/* Playlists */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Playlists
            </h3>
          </div>
          {playlists.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Aucune playlist</p>
          ) : (
            <div className="space-y-1">
              {playlists.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    // For now, navigate to first item if exists
                    if (p.items && p.items.length > 0) {
                      router.push(`/song/${p.items[0].originalSongId || ''}`);
                    }
                    onClose?.();
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-100"
                >
                  <MusicalNoteIcon className="mr-3 h-5 w-5" />
                  <span className="truncate flex-1 text-left">{p.name}</span>
                  {p.items && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      {p.items.length}
                    </span>
                  )}
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
              Récemment ajoutées
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
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(song.createdAt).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">Aucune chanson récente</p>
            )}
          </div>
        )}

        {/* Popular Songs Tab */}
        {activeTab === 'popular' && (
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Les plus écoutées
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
                  <span className="text-xs text-blue-600 font-medium ml-2">
                  </span>
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">Aucune donnée de vues disponible</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
