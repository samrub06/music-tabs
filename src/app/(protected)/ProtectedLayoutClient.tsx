'use client'

import Header from '@/components/Header'
import DashboardSidebar from '@/components/DashboardSidebar'
import BottomNavigation from '@/components/BottomNavigation'
import { AuthProvider, useAuthContext } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { SidebarProvider } from '@/context/SidebarContext'
import { Inter } from 'next/font/google'
import { useRouter, usePathname } from 'next/navigation'
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
          onClose={() => {}}
          onMoveSong={updateSongFolderAction}
        />
      </div>
    </>
  )
}

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthContext()
  const pathname = usePathname()
  const router = useRouter()

  // Check if this is a library route (allowed without auth)
  const isLibraryRoute = pathname === '/library' || pathname.startsWith('/library/')
  
  // Redirect non-authenticated users from protected routes (except /library)
  useEffect(() => {
    // Don't redirect while auth is loading
    if (authLoading) return
    
    // Don't redirect if already on home page or library route
    if (pathname === '/' || isLibraryRoute) return
    
    // Redirect non-authenticated users from protected routes
    if (!user) {
      router.push('/')
    }
  }, [user, authLoading, pathname, isLibraryRoute]) // Removed router from dependencies as it's stable

  // Map pathname to page title
  const getPageTitle = (path: string): string | undefined => {
    if (path.startsWith('/song/')) {
      return undefined // No title for song pages
    }
    if (path === '/library' || path.startsWith('/library/')) {
      return 'Library'
    }
    if (path === '/songs' || path.startsWith('/songs/')) {
      return 'Songs'
    }
    if (path === '/folders' || path.startsWith('/folders/')) {
      return 'Folders'
    }
    if (path === '/chords' || path.startsWith('/chords/')) {
      return 'Chords'
    }
    if (path === '/dashboard' || path.startsWith('/dashboard/')) {
      return 'Dashboard'
    }
    if (path === '/playlists' || path.startsWith('/playlists/')) {
      return 'Playlists'
    }
    if (path === '/playlist' || path.startsWith('/playlist/')) {
      return 'Créer une playlist'
    }
    return undefined
  }

  const pageTitle = getPageTitle(pathname)

  return (
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Header onMenuClick={() => {}} pageTitle={pageTitle} />

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

