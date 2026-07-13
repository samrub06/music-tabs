'use client'

import Header from '@/components/Header'
import { AppSidebar } from '@/components/AppSidebar'
import BottomNavigation from '@/components/BottomNavigation'
import { useAuthContext } from '@/context/AuthContext'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { updateStreakAction } from '@/app/(protected)/gamification/actions'
import { needsOnboardingAction } from '@/app/(protected)/onboarding/actions'
import { ScrollChromeProvider } from '@/context/ScrollChromeContext'
import { PageHeaderProvider } from '@/context/PageHeaderContext'

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthContext()
  const pathname = usePathname()
  const router = useRouter()
  const isInviteRoute = pathname.startsWith('/invite/')
  const isOnboardingRoute = pathname === '/onboarding'
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/search' ||
    pathname.startsWith('/search/') ||
    pathname === '/explore' ||
    pathname.startsWith('/explore/') ||
    pathname.startsWith('/library/') ||
    isInviteRoute

  const requiresAuth = !isPublicRoute

  useEffect(() => {
    if (authLoading) return
    if (!requiresAuth) return
    if (!user) {
      router.push('/')
    }
  }, [user, authLoading, pathname, requiresAuth, router])

  useEffect(() => {
    if (!user || authLoading || isOnboardingRoute || isInviteRoute) return
    needsOnboardingAction()
      .then((needs) => {
        if (needs) {
          router.push('/onboarding')
        }
      })
      .catch(console.error)
  }, [user, authLoading, isOnboardingRoute, isInviteRoute, router])

  useEffect(() => {
    if (!user || authLoading) return
    updateStreakAction().catch(error => {
      console.error('Error updating streak:', error)
    })
  }, [user, authLoading])

  return (
    <ScrollChromeProvider>
    <PageHeaderProvider>
    <SidebarProvider defaultOpen>
      <div className="flex h-svh w-full bg-gray-50 dark:bg-gray-900">
        {user && <AppSidebar />}
        <SidebarInset className="flex flex-col overflow-hidden lg:px-4 xl:px-5">
          <Header />
          <div
            className={`flex-1 flex flex-col min-h-0 w-full max-w-full overflow-hidden ${
              user ? 'pb-16 lg:pb-0' : ''
            }`}
          >
            {children}
          </div>
        </SidebarInset>
        {/* Keep outside SidebarInset: overflow-hidden there clips position:fixed on mobile */}
        {user && <BottomNavigation />}
      </div>
    </SidebarProvider>
    </PageHeaderProvider>
    </ScrollChromeProvider>
  )
}

export default function ProtectedLayoutClient({ children }: { children: React.ReactNode }) {
  return <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
}
