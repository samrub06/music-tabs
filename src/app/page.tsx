'use client';

import AddSongForm from '@/components/AddSongForm';
import SongTable from '@/components/SongTable';
import { useApp } from '@/context/AppContext';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Home() {
  const { searchQuery, setSearchQuery } = useApp();
  const { user, loading, signInWithGoogle } = useAuthContext();
  const [showAddSong, setShowAddSong] = useState(false);
  const { t } = useLanguage();


  // Afficher un loader pendant la vérification de l'auth
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
        {/* Banner pour encourager la connexion si non connecté */}
        {!user && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  🎸 {t('auth.welcome')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('auth.signInToSaveYourSongs')}
                </p>
              </div>
              <button
                onClick={signInWithGoogle}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm flex-shrink-0"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>{t('auth.signInWithGoogle')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Search Bar and Add Button - Responsive Layout */}
        <div className="mb-4 sm:mb-6">
          {/* Mobile: Search and Add button on same line */}
          <div className="flex flex-col sm:flex-row sm:justify-center gap-3 sm:gap-4">
            {/* Search Bar */}
            <div className="flex-1 sm:max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('songs.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

                   {/* Add Song Button - Always visible */}
                   <div className="flex-shrink-0">
                     <button
                       onClick={() => setShowAddSong(true)}
                       className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
                     >
                       <PlusIcon className="h-4 sm:h-5 w-4 sm:w-5 sm:mr-2" />
                       <span className="sm:hidden">{t('navigation.addSongMobile')}</span>
                       <span className="hidden sm:inline">{t('songs.addNew')}</span>
                     </button>
                   </div>
          </div>
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
