'use client';

import { useApp } from '@/context/AppContext';
import {
    FolderIcon,
    FolderOpenIcon,
    MusicalNoteIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Sidebar() {
  const { 
    folders, 
    songs, 
    currentFolder, 
    setCurrentFolder,
    setCurrentSong,
    addFolder,
    updateFolder,
    deleteFolder
  } = useApp();

  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

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
    if (confirm('Êtes-vous sûr de vouloir supprimer ce dossier ? Les chansons seront déplacées vers "Sans dossier".')) {
      deleteFolder(folderId);
    }
  };

  const getSongCountByFolder = (folderId: string | null) => {
    return songs.filter(song => song.folderId === folderId).length;
  };

  const unorganizedSongs = getSongCountByFolder(null);

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h2>
        
        {/* All Songs */}
        <div className="space-y-1">
          <button
            onClick={() => {
              setCurrentFolder(null);
              setCurrentSong(null); // Close song view when changing folder
            }}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              currentFolder === null
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MusicalNoteIcon className="mr-3 h-5 w-5" />
            Toutes les chansons
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
              }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentFolder === 'unorganized'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FolderIcon className="mr-3 h-5 w-5" />
              Sans dossier
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
              Dossiers
            </h3>
            <button
              onClick={() => setShowAddForm(true)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Ajouter un dossier"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Add Folder Form */}
          {showAddForm && (
            <div className="mb-3 p-2 border border-gray-200 rounded-md bg-gray-50">
              <input
                type="text"
                placeholder="Nom du dossier"
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
                  Annuler
                </button>
                <button
                  onClick={handleAddFolder}
                  disabled={!newFolderName.trim()}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Créer
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
                        title="Renommer"
                      >
                        <PencilIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Supprimer"
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
              Aucun dossier. Cliquez sur + pour en créer un.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
