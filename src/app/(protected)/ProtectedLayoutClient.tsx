'use client'

import Header from '@/components/Header'
import DashboardSidebar from '@/components/DashboardSidebar'
import BottomNavigation from '@/components/BottomNavigation'
import { AuthProvider, useAuthContext } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { SidebarProvider } from '@/context/SidebarContext'
import { Inter } from 'next/font/google'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { folderRepo } from '@/lib/services/folderRepo'
import { songRepo } from '@/lib/services/songRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { updateSongFolderAction } from '@/app/(protected)/dashboard/actions'
import type { Folder, Song, Playlist } from '@/types'

const inter = Inter({ subsets: ['latin'] })

function SidebarWrapper() {
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

  if (!user || loading) {
    return null
  }

  return (
    <>
      {/* Sidebar - Desktop only */}
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
          onClose={() => setSidebarOpen(false)}
          onMoveSong={updateSongFolderAction}
        />
      </div>
    </>
  )
}

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext()

  return (
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Header onMenuClick={() => {}} />

      <div className="flex-1 flex overflow-hidden">
        {user && <SidebarWrapper />}
        
        {/* Main content */}
          <div className="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-hidden pb-16 lg:pb-0">
            {children}
        </div>
          </div>
          
          {/* Bottom Navigation - Mobile only */}
          <BottomNavigation />
        </div>
  )
}

export default function ProtectedLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SidebarProvider>
          <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
        </SidebarProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

