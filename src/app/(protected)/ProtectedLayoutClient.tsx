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
import { ScrollChromeProvider } from '@/context/ScrollChromeContext'
import { PageHeaderProvider } from '@/context/PageHeaderContext'

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthContext()
  const { t } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/search' ||
    pathname.startsWith('/search/') ||
    pathname === '/explore' ||
    pathname.startsWith('/explore/') ||
    pathname.startsWith('/library/')

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
    if (path === '/' || path === '/search') return t('navigation.home')
    if (path.startsWith('/search/')) return undefined
    if (path === '/songs') return t('navigation.songs')
    if (path.startsWith('/songs/')) return undefined
    if (path === '/explore' || path.startsWith('/explore/')) return t('navigation.explore')
    if (path === '/add-song') return t('navigation.addSong')
    if (path === '/folders') return t('navigation.folders')
    if (path.startsWith('/folders/')) return undefined
    if (path === '/chords') return t('navigation.chords')
    if (path.startsWith('/chords/')) return undefined
    if (path === '/playlists') return t('navigation.playlists')
    if (path.startsWith('/playlists/')) return undefined
    if (path === '/playlist' || path.startsWith('/playlist/')) {
      if (path.match(/^\/playlist\/[^/]+$/)) return undefined
      return t('createMenu.createPlaylist')
    }
    if (path === '/profile' || path.startsWith('/profile/')) return undefined
    if (path === '/leaderboard' || path.startsWith('/leaderboard/')) return t('navigation.leaderboard')
    return undefined
  }

  const pageTitle = getPageTitle(pathname)

  return (
    <ScrollChromeProvider>
    <PageHeaderProvider>
    <SidebarProvider defaultOpen>
      <div className="flex h-svh w-full bg-gray-50 dark:bg-gray-900">
        {user && <AppSidebar />}
        <SidebarInset className="flex flex-col overflow-hidden lg:px-4 xl:px-5">
          <Header pageTitle={pageTitle} />
          <div
            className={`flex-1 flex flex-col min-h-0 w-full max-w-full overflow-hidden ${
              user ? 'pb-16 lg:pb-0' : ''
            }`}
          >
            {children}
          </div>
          {user && <BottomNavigation />}
        </SidebarInset>
      </div>
    </SidebarProvider>
    </PageHeaderProvider>
    </ScrollChromeProvider>
  )
}

export default function ProtectedLayoutClient({ children }: { children: React.ReactNode }) {
  return <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
}
