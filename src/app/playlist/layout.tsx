'use client'

import Header from '@/components/Header'
import DashboardSidebar from '@/components/DashboardSidebar'
import { useAuthContext } from '@/context/AuthContext'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { folderRepo } from '@/lib/services/folderRepo'
import { songRepo } from '@/lib/services/songRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { updateSongFolderAction } from '@/app/(protected)/dashboard/actions'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ReactNode, useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Folder, Song, Playlist } from '@/types'

// Cache global pour les données de la sidebar (persiste entre navigations)
let playlistSidebarDataCache: {
  folders: Folder[]
  songs: Song[]
  playlists: Playlist[]
  timestamp: number
  userId: string | null
} | null = null

const CACHE_DURATION = 30000 // 30 secondes

export default function PlaylistLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, loading: authLoading } = useAuthContext()
  const { supabase } = useSupabase()
  const [folders, setFolders] = useState<Folder[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const router = useRouter()

  // Vérifier si le cache est valide
  const isCacheValid = useMemo(() => {
    if (!playlistSidebarDataCache) return false
    if (playlistSidebarDataCache.userId !== user?.id) return false
    const now = Date.now()
    return (now - playlistSidebarDataCache.timestamp) < CACHE_DURATION
  }, [user?.id])

  useEffect(() => {
    if (!user || authLoading) {
      setLoading(false)
      return
    }

    // Utiliser le cache si valide
    if (isCacheValid && playlistSidebarDataCache) {
      setFolders(playlistSidebarDataCache.folders)
      setSongs(playlistSidebarDataCache.songs)
      setPlaylists(playlistSidebarDataCache.playlists)
      setLoading(false)
      return
    }

    // Sinon, charger les données
    const fetchData = async () => {
      try {
        setLoading(true)
        const [foldersData, songsData, playlistsData] = await Promise.all([
          folderRepo(supabase).getAllFolders(),
          songRepo(supabase).getAllSongs(),
          playlistRepo(supabase).getAllPlaylists()
        ])
        
        // Mettre à jour le cache
        playlistSidebarDataCache = {
          folders: foldersData,
          songs: songsData,
          playlists: playlistsData,
          timestamp: Date.now(),
          userId: user.id
        }
        
        setFolders(foldersData)
        setSongs(songsData)
        setPlaylists(playlistsData)
      } catch (error) {
        console.error('Error fetching sidebar data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, authLoading, supabase, isCacheValid])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex-1 flex overflow-hidden">
        {/* Only show sidebar if user is authenticated */}
        {user && !loading && (
          <>
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
              <div className="flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 lg:hidden">
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menu</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <DashboardSidebar
                songs={songs}
                folders={folders}
                playlists={playlists}
                currentFolder={currentFolder}
                onFolderChange={(folderId) => {
                  setCurrentFolder(folderId)
                  router.refresh()
                }}
                onClose={() => setSidebarOpen(false)}
                onMoveSong={updateSongFolderAction}
              />
            </div>
          </>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

