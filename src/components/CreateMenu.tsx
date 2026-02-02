'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { 
  MusicalNoteIcon, 
  SparklesIcon, 
  FolderIcon,
  MagnifyingGlassIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { addFolderAction, createPlaylistAction } from '@/app/(protected)/dashboard/actions'
import ManualEntryForm from './ManualEntryForm'
import PlaylistImporter from './PlaylistImporter'
import { Folder } from '@/types'

interface CreateMenuProps {
  isOpen: boolean
  onClose: () => void
  folders?: Folder[]
}

type CreateOption = 'menu' | 'search' | 'manual' | 'playlist' | 'folder' | 'import'

export default function CreateMenu({ isOpen, onClose, folders = [] }: CreateMenuProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [currentView, setCurrentView] = useState<CreateOption>('menu')
  const [isPending, startTransition] = useTransition()
  const [playlistName, setPlaylistName] = useState('')
  const [folderName, setFolderName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setCurrentView('menu')
    setPlaylistName('')
    setFolderName('')
    setError(null)
    onClose()
  }

  const handleSearchSong = () => {
    handleClose()
    router.push('/search?focus=true')
  }

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      setError(t('createMenu.playlistNameRequired'))
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        await createPlaylistAction(playlistName.trim())
        handleClose()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : t('createMenu.createPlaylistError'))
      }
    })
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setError(t('createMenu.folderNameRequired'))
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        await addFolderAction(folderName.trim())
        handleClose()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : t('createMenu.createFolderError'))
      }
    })
  }

  const handleManualEntrySuccess = () => {
    handleClose()
    router.refresh()
  }

  const handleImportComplete = () => {
    handleClose()
    router.refresh()
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="bottom" className="max-h-[auto] z-50 pb-6">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-left text-lg">{t('createMenu.title')}</SheetTitle>
          </SheetHeader>

          <div className="mt-4">
            {currentView === 'menu' && (
              <div className="space-y-2 pb-2">
                <button
                  onClick={handleSearchSong}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <MagnifyingGlassIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {t('createMenu.searchSong')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('createMenu.searchSongDescription')}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView('manual')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <MusicalNoteIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {t('createMenu.manualEntry')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('createMenu.manualEntryDescription')}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView('playlist')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {t('createMenu.createPlaylist')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('createMenu.createPlaylistDescription')}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    handleClose()
                    router.push('/ai-playlist')
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {t('createMenu.generatePlaylistWithAI')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('createMenu.generatePlaylistWithAIDescription')}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView('folder')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <FolderIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {t('createMenu.createFolder')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('createMenu.createFolderDescription')}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView('import')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <CloudArrowDownIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {t('createMenu.importUltimateGuitar')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('createMenu.importUltimateGuitarDescription')}
                    </div>
                  </div>
                </button>
              </div>
            )}

            {currentView === 'playlist' && (
              <div className="space-y-4">
                <button
                  onClick={() => setCurrentView('menu')}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <span>←</span> {t('createMenu.back')}
                </button>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('createMenu.playlistName')}
                  </label>
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => {
                      setPlaylistName(e.target.value)
                      setError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreatePlaylist()
                      }
                    }}
                    placeholder={t('createMenu.playlistNamePlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCreatePlaylist}
                  disabled={isPending || !playlistName.trim()}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isPending ? t('createMenu.creating') : t('createMenu.createPlaylistButton')}
                </button>
              </div>
            )}

            {currentView === 'manual' && (
              <div className="space-y-4">
                <button
                  onClick={() => setCurrentView('menu')}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <span>←</span> {t('createMenu.back')}
                </button>

                <ManualEntryForm
                  folders={folders}
                  onClose={() => setCurrentView('menu')}
                  onSuccess={handleManualEntrySuccess}
                />
              </div>
            )}

            {currentView === 'folder' && (
              <div className="space-y-4">
                <button
                  onClick={() => setCurrentView('menu')}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <span>←</span> {t('createMenu.back')}
                </button>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('createMenu.folderName')}
                  </label>
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => {
                      setFolderName(e.target.value)
                      setError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateFolder()
                      }
                    }}
                    placeholder={t('createMenu.folderNamePlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCreateFolder}
                  disabled={isPending || !folderName.trim()}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isPending ? t('createMenu.creating') : t('createMenu.createFolderButton')}
                </button>
              </div>
            )}

            {currentView === 'import' && (
              <div className="space-y-4">
                <button
                  onClick={() => setCurrentView('menu')}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <span>←</span> {t('createMenu.back')}
                </button>

                <div className="max-h-[70vh] overflow-y-auto">
                  <PlaylistImporter
                    onImportComplete={handleImportComplete}
                  />
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
