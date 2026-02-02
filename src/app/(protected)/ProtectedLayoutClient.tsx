'use client'

import Header from '@/components/Header'
import DashboardSidebar from '@/components/DashboardSidebar'
import BottomNavigation from '@/components/BottomNavigation'
import CreateMenu from '@/components/CreateMenu'
import { useAuthContext } from '@/context/AuthContext'
import { useFoldersContext } from '@/context/FoldersContext'
import { SidebarProvider } from '@/context/SidebarContext'
import { useLanguage } from '@/context/LanguageContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { folderRepo } from '@/lib/services/folderRepo'
import { songRepo } from '@/lib/services/songRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { updateSongFolderAction } from '@/app/(protected)/dashboard/actions'
import { updateStreakAction } from '@/app/(protected)/gamification/actions'
import type { Folder, Song, Playlist } from '@/types'

// Cache global pour les données de la sidebar (persiste entre navigations)
let sidebarDataCache: {
  folders: Folder[]
  songs: Song[]
  playlists: Playlist[]
  timestamp: number
  userId: string | null
} | null = null

const CACHE_DURATION = 30000 // 30 secondes

function SidebarWrapper({ onCreateClick }: { onCreateClick?: () => void }) {
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
    if (!sidebarDataCache) return false
    if (sidebarDataCache.userId !== user?.id) return false
    const now = Date.now()
    return (now - sidebarDataCache.timestamp) < CACHE_DURATION
  }, [user?.id])

  useEffect(() => {
    if (!user || authLoading) {
      setLoading(false)
      return
    }

    // Utiliser le cache si valide
    if (isCacheValid && sidebarDataCache) {
      setFolders(sidebarDataCache.folders)
      setSongs(sidebarDataCache.songs)
      setPlaylists(sidebarDataCache.playlists)
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
        sidebarDataCache = {
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

  if (!user || (loading && !isCacheValid)) {
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
          onCreateClick={onCreateClick}
        />
      </div>
    </>
  )
}

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthContext()
  const { t } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const { folders: createMenuFolders } = useFoldersContext()

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
  }, [user, authLoading, pathname, isLibraryRoute, router])

  // Update streak on page load (once per session)
  useEffect(() => {
    if (!user || authLoading) return
    
    // Update streak (only once per page load, not on every navigation)
    updateStreakAction().catch(error => {
      console.error('Error updating streak:', error)
    })
  }, [user?.id]) // Only run when user changes, not on every pathname change

  // Map pathname to page title
  const getPageTitle = (path: string): string | undefined => {
    if (path.startsWith('/song/')) {
      return undefined // No title for song pages
    }
    if (path === '/library' || path.startsWith('/library/')) {
      return t('navigation.library')
    }
    if (path === '/search' || path.startsWith('/search/')) {
      return t('navigation.search')
    }
    if (path === '/songs' || path.startsWith('/songs/')) {
      return t('navigation.songs')
    }
    if (path === '/folders' || path.startsWith('/folders/')) {
      return t('navigation.folders')
    }
    if (path === '/chords' || path.startsWith('/chords/')) {
      return t('navigation.chords')
    }
    if (path === '/playlists' || path.startsWith('/playlists/')) {
      return t('navigation.playlists')
    }
    if (path === '/playlist' || path.startsWith('/playlist/')) {
      // Si c'est /playlist/[playlistId], on ne met pas de titre (sera géré par la page)
      if (path.match(/^\/playlist\/[^/]+$/)) {
        return undefined
      }
      return t('createMenu.createPlaylist')
    }
    return undefined
  }

  const pageTitle = getPageTitle(pathname)

  return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
          <Header onMenuClick={() => {}} pageTitle={pageTitle} />

      <div className="flex-1 flex overflow-hidden">
        {user && <SidebarWrapper onCreateClick={() => setIsCreateMenuOpen(true)} />}
        
        {/* Main content */}
          <div className="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-hidden pb-16 lg:pb-0">
            {children}
        </div>
          </div>
          
          {/* Bottom Navigation - Mobile only */}
          <BottomNavigation />
          
          {/* Create Menu - Desktop only (mobile uses BottomNavigation) */}
          {user && (
            <CreateMenu
              isOpen={isCreateMenuOpen}
              onClose={() => setIsCreateMenuOpen(false)}
              folders={createMenuFolders}
            />
          )}
        </div>
  )
}

export default function ProtectedLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </SidebarProvider>
  )
}

