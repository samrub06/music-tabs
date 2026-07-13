'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Home,
  Library,
  ListMusic,
  FolderOpen,
  Music,
  Trophy,
  Users,
  Disc3,
} from 'lucide-react'
import { AppLogo } from '@/components/AppLogo'
import { SITE_NAME } from '@/lib/seo/site'
import { useLanguage } from '@/context/LanguageContext'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { getIsAdminAction } from '@/app/(protected)/admin/actions'

const MAIN_NAV = [
  { href: '/', labelKey: 'navigation.home', icon: Home, match: (p: string) => p === '/' || p === '/search' || p.startsWith('/search/') },
  { href: '/songs', labelKey: 'navigation.songs', icon: Library, match: (p: string) => p === '/songs' || p.startsWith('/songs/') },
  { href: '/folders', labelKey: 'navigation.folders', icon: FolderOpen, match: (p: string) => p === '/folders' || p.startsWith('/folders/') },
  { href: '/chords', labelKey: 'navigation.chords', icon: Music, match: (p: string) => p === '/chords' || p.startsWith('/chords/') },
  { href: '/playlists', labelKey: 'navigation.playlists', icon: ListMusic, match: (p: string) => p === '/playlists' || p.startsWith('/playlists/') || p.startsWith('/playlist/') },
] as const

const SECONDARY_NAV = [
  { href: '/friends', labelKey: 'navigation.friends', icon: Users, match: (p: string) => p === '/friends' || p.startsWith('/friends/') },
  { href: '/leaderboard', labelKey: 'navigation.leaderboard', icon: Trophy, match: (p: string) => p === '/leaderboard' || p.startsWith('/leaderboard/') },
] as const

const ADMIN_NAV = [
  {
    href: '/admin/songs',
    labelKey: 'navigation.adminSongs',
    icon: Disc3,
    match: (p: string) => p === '/admin/songs' || p.startsWith('/admin/songs/'),
  },
  {
    href: '/admin/users',
    labelKey: 'navigation.adminUsers',
    icon: Users,
    match: (p: string) => p === '/admin/users' || p.startsWith('/admin/users/'),
  },
] as const

export function AppSidebar() {
  const pathname = usePathname()
  const { t, isRtl } = useLanguage()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    getIsAdminAction()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false))
  }, [])

  return (
    <Sidebar collapsible="icon" side={isRtl ? 'right' : 'left'}>
      <SidebarHeader className="group-data-[collapsible=icon]:items-center">
        <SidebarMenu>
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              size="lg"
              asChild
              className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
            >
              <Link href="/" className="flex min-w-0 items-center gap-2">
                <AppLogo
                  variant="portrait"
                  className="h-8 w-8 shrink-0"
                />
                <span className="truncate text-base font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
                  {SITE_NAME}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('navigation.home')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV.map(({ href, labelKey, icon: Icon, match }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={match(pathname)} tooltip={t(labelKey)}>
                    <Link href={href} prefetch>
                      <Icon />
                      <span>{t(labelKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('navigation.more')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECONDARY_NAV.map(({ href, labelKey, icon: Icon, match }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={match(pathname)} tooltip={t(labelKey)}>
                    <Link href={href} prefetch>
                      <Icon />
                      <span>{t(labelKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('navigation.admin')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_NAV.map(({ href, labelKey, icon: Icon, match }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={match(pathname)} tooltip={t(labelKey)}>
                      <Link href={href} prefetch>
                        <Icon />
                        <span>{t(labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
