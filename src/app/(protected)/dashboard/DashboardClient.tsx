'use client'

import AddSongForm from '@/components/AddSongForm'
import SongTable from '@/components/SongTable'
import DashboardSidebar from '@/components/DashboardSidebar'
import { useLanguage } from '@/context/LanguageContext'
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { Song, Folder, Playlist } from '@/types'
import { updateSongFolderAction, deleteSongsAction, deleteAllSongsAction, updateSongAction } from './actions'

interface DashboardClientProps {
  songs: Song[]
  folders: Folder[]
  playlists?: Playlist[]
  userEmail?: string
}

export default function DashboardClient({ songs, folders, playlists = [], userEmail }: DashboardClientProps) {
  const { t } = useLanguage()
  const [showAddSong, setShowAddSong] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
          </div>
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:max-w-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:hidden">
            <span className="text-lg font-semibold">Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <DashboardSidebar
            songs={songs}
            folders={folders}
            playlists={playlists}
            currentFolder={currentFolder}
            onFolderChange={setCurrentFolder}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Bienvenue, {userEmail || 'Utilisateur'}
          </p>
        </div>

        {/* Search Bar and Add Button */}
        <div className="mb-4 sm:mb-6">
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

            {/* Add Song Button */}
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
        <SongTable
          songs={songs}
          folders={folders}
          playlists={playlists}
          currentFolder={currentFolder}
          currentPlaylistId={currentPlaylistId}
          searchQuery={searchQuery}
          hasUser={true}
          onFolderChange={updateSongFolderAction}
          onDeleteSongs={deleteSongsAction}
          onDeleteAllSongs={deleteAllSongsAction}
          onCurrentFolderChange={setCurrentFolder}
          onUpdateSong={updateSongAction}
        />
        </div>
      </div>

      {/* Add song modal */}
      <AddSongForm 
        isOpen={showAddSong}
        onClose={() => setShowAddSong(false)}
        folders={folders}
      />
    </>
  )
}

