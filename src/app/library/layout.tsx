'use client'

import { ReactNode, useState, useEffect } from 'react'
import Header from '@/components/Header'
import DashboardSidebar from '@/components/DashboardSidebar'
import { useAuthContext } from '@/context/AuthContext'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { folderRepo } from '@/lib/services/folderRepo'
import { songRepo } from '@/lib/services/songRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { updateSongFolderAction } from '@/app/(protected)/dashboard/actions'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import type { Folder, Song, Playlist } from '@/types'

export default function LibraryLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, loading: authLoading } = useAuthContext()
  const { supabase } = useSupabase()
  const [folders, setFolders] = useState<Folder[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!user || authLoading) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const [foldersData, songsData, playlistsData] = await Promise.all([
          folderRepo(supabase).getAllFolders(),
          songRepo(supabase).getAllSongs(),
          playlistRepo(supabase).getAllPlaylists()
        ])
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
  }, [user, authLoading, supabase])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
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
        <div className="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

