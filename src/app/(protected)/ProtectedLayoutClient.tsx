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
import { cn } from '@/lib/utils'

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
    pathname === '/jam-lab' ||
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
      <div className="flex h-svh w-full bg-background">
        {user && !isOnboardingRoute && <AppSidebar />}
        <SidebarInset
          className={cn(
            'flex flex-col overflow-hidden bg-background',
            !isOnboardingRoute && 'lg:px-4 xl:px-5'
          )}
        >
          {!isOnboardingRoute ? <Header /> : null}
          <div
            className={cn(
              'flex min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden',
              user && !isOnboardingRoute ? 'pb-16 lg:pb-0' : ''
            )}
          >
            {children}
          </div>
        </SidebarInset>
        {/* Keep outside SidebarInset: overflow-hidden there clips position:fixed on mobile */}
        {user && !isOnboardingRoute ? <BottomNavigation /> : null}
      </div>
    </SidebarProvider>
    </PageHeaderProvider>
    </ScrollChromeProvider>
  )
}

export default function ProtectedLayoutClient({ children }: { children: React.ReactNode }) {
  return <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
}
