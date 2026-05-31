'use client'

import Header from '@/components/Header'
import { AppSidebar } from '@/components/AppSidebar'
import BottomNavigation from '@/components/BottomNavigation'
import { useAuthContext } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { updateStreakAction } from '@/app/(protected)/gamification/actions'

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthContext()
  const { t } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()
  const isPublicRoute = pathname === '/search' || pathname.startsWith('/search/') || pathname.startsWith('/library/')

  useEffect(() => {
    if (authLoading) return
    if (pathname === '/' || isPublicRoute) return
    if (!user) {
      router.push('/')
    }
  }, [user, authLoading, pathname, isPublicRoute, router])

  useEffect(() => {
    if (!user || authLoading) return
    updateStreakAction().catch(error => {
      console.error('Error updating streak:', error)
    })
  }, [user?.id, authLoading])

  const getPageTitle = (path: string): string | undefined => {
    if (path.startsWith('/song/')) return undefined
    if (path.startsWith('/library/')) return t('navigation.library')
    if (path === '/search' || path.startsWith('/search/')) return t('navigation.search')
    if (path === '/songs' || path.startsWith('/songs/')) return t('navigation.songs')
    if (path === '/folders' || path.startsWith('/folders/')) return t('navigation.folders')
    if (path === '/chords' || path.startsWith('/chords/')) return t('navigation.chords')
    if (path === '/playlists' || path.startsWith('/playlists/')) return t('navigation.playlists')
    if (path === '/playlist' || path.startsWith('/playlist/')) {
      if (path.match(/^\/playlist\/[^/]+$/)) return undefined
      return t('createMenu.createPlaylist')
    }
    if (path === '/profile' || path.startsWith('/profile/')) return t('navigation.profile')
    if (path === '/leaderboard' || path.startsWith('/leaderboard/')) return t('navigation.leaderboard')
    return undefined
  }

  const pageTitle = getPageTitle(pathname)

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-svh w-full bg-gray-50 dark:bg-gray-900">
        {user && <AppSidebar />}
        <SidebarInset className="flex flex-col overflow-hidden">
          <Header pageTitle={pageTitle} />
          <div className="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-hidden pb-16 lg:pb-0">
            {children}
          </div>
          <BottomNavigation />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default function ProtectedLayoutClient({ children }: { children: React.ReactNode }) {
  return <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
}
