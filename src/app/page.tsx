'use client';

import AddSongForm from '@/components/AddSongForm';
import SongTable from '@/components/SongTable';
import { useApp } from '@/context/AppContext';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Home() {
  const { exportData, searchQuery, setSearchQuery } = useApp();
  const [showAddSong, setShowAddSong] = useState(false);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'music-library.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
        {/* Search Bar - Centered and Full Width */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-center">
            <div className="relative w-full max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher une chanson..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => setShowAddSong(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
            <span className="hidden sm:inline">Ajouter une chanson</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
          
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="hidden sm:inline">Exporter la bibliothèque</span>
            <span className="sm:hidden">Exporter</span>
          </button>
        </div>

        {/* Song table */}
        <SongTable />
      </div>

      {/* Add song modal */}
      <AddSongForm 
        isOpen={showAddSong}
        onClose={() => setShowAddSong(false)}
      />
    </>
  );
}
