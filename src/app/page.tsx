'use client';

import AddSongForm from '@/components/AddSongForm';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SongList from '@/components/SongList';
import SongViewer from '@/components/SongViewer';
import { AppProvider, useApp } from '@/context/AppContext';
import { Bars3Icon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

function AppContent() {
  const { currentSong, exportData } = useApp();
  const [showAddSong, setShowAddSong] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
          </div>
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:hidden">
            <span className="text-lg font-semibold">Navigation</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentSong ? (
            <SongViewer />
          ) : (
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Mobile menu button */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  onClick={() => setShowAddSong(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Ajouter une chanson
                </button>
                
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Exporter la bibliothèque
                </button>
              </div>

              {/* Song list */}
              <SongList />
            </div>
          )}
        </div>
      </div>

      {/* Add song modal */}
      <AddSongForm 
        isOpen={showAddSong}
        onClose={() => setShowAddSong(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
