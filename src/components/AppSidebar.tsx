'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Search,
  Library,
  Sparkles,
  FolderOpen,
  Music,
  Trophy,
} from 'lucide-react'
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

const MAIN_NAV = [
  { href: '/search', labelKey: 'navigation.search', icon: Search, match: (p: string) => p === '/search' || p.startsWith('/search/') },
  { href: '/songs', labelKey: 'navigation.songs', icon: Library, match: (p: string) => p === '/songs' || p.startsWith('/songs/') },
  { href: '/playlists', labelKey: 'navigation.playlists', icon: Sparkles, match: (p: string) => p === '/playlists' || p.startsWith('/playlists/') || p.startsWith('/playlist/') },
] as const

const SECONDARY_NAV = [
  { href: '/folders', labelKey: 'navigation.folders', icon: FolderOpen, match: (p: string) => p === '/folders' || p.startsWith('/folders/') },
  { href: '/chords', labelKey: 'navigation.chords', icon: Music, match: (p: string) => p === '/chords' || p.startsWith('/chords/') },
  { href: '/leaderboard', labelKey: 'navigation.leaderboard', icon: Trophy, match: (p: string) => p === '/leaderboard' || p.startsWith('/leaderboard/') },
] as const

export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/search">
                <span className="text-xl leading-none">🌶️</span>
                <span className="font-semibold group-data-[collapsible=icon]:hidden">{t('common.appName')}</span>
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
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
