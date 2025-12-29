'use client'

import { ReactNode, useState, useEffect } from 'react'
import Header from '@/components/Header'
import DashboardSidebar from '@/components/DashboardSidebar'
import BottomNavigation from '@/components/BottomNavigation'
import { useAuthContext } from '@/context/AuthContext'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { folderRepo } from '@/lib/services/folderRepo'
import { songRepo } from '@/lib/services/songRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { updateSongFolderAction } from '@/app/(protected)/dashboard/actions'
import { useRouter } from 'next/navigation'
import type { Folder, Song, Playlist } from '@/types'

export default function LibraryLayout({ children }: { children: ReactNode }) {
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
      <Header onMenuClick={() => {}} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Only show sidebar if user is authenticated - Desktop only */}
        {user && !loading && (
          <div className="hidden lg:block">
            <DashboardSidebar
              songs={songs}
              folders={folders}
              playlists={playlists}
              currentFolder={currentFolder}
              onFolderChange={(folderId) => {
                setCurrentFolder(folderId)
                router.refresh()
              }}
              onClose={() => {}}
              onMoveSong={updateSongFolderAction}
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-hidden pb-16 lg:pb-0">
          {children}
        </div>
      </div>
      
      {/* Bottom Navigation - Mobile only, shown for authenticated users */}
      <BottomNavigation />
    </div>
  )
}

