'use client';

import { useApp } from '@/context/AppContext';
import { FolderIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Header() {
  const { 
    setSearchQuery, 
    searchQuery, 
    setCurrentFolder, 
    currentFolder, 
    folders 
  } = useApp();
  
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      // This will be implemented when we create the folder management
      setNewFolderName('');
      setShowAddFolder(false);
    }
  };

  const currentFolderName = currentFolder 
    ? folders.find(f => f.id === currentFolder)?.name || 'Dossier inconnu'
    : 'Toutes les chansons';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo - Mobile & Desktop */}
          <div className="flex items-center space-x-2">
            <span className="text-xl md:text-2xl">🎸</span>
            <span className="hidden md:block text-lg font-semibold text-gray-900">
              Music Tabs
            </span>
          </div>

          {/* Search Bar - Responsive */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 md:pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Current Folder Display - Desktop Only */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-md">
              <FolderIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700 max-w-32 truncate">{currentFolderName}</span>
            </div>

            {/* Add Folder Button */}
            <button
              onClick={() => setShowAddFolder(true)}
              className="inline-flex items-center px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PlusIcon className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Nouveau dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Folder Modal */}
      {showAddFolder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Créer un nouveau dossier
              </h3>
              <input
                type="text"
                placeholder="Nom du dossier"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddFolder()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowAddFolder(false);
                    setNewFolderName('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddFolder}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
