'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Contrast,
  Globe,
  Menu,
  Moon,
  Search,
  Sun,
  Trophy,
  Users,
} from 'lucide-react'
import { BackArrowIcon } from '@/components/icons/DirectionalIcons'
import { useAuthContext } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useScrollChromeOptional } from '@/context/ScrollChromeContext'
import { usePageHeaderOptional } from '@/context/PageHeaderContext'
import { useTheme } from '@/context/ThemeContext'
import { AppLogo } from '@/components/AppLogo'
import HeaderLevelProgress from './gamification/HeaderLevelProgress'
import type { ThemePreference } from '@/context/ThemeContext'
import NotificationBell from './social/NotificationBell'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick?: () => void
}

const LANGUAGES = [
  { code: 'en' as const, name: 'English', flag: '🇺🇸' },
  { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
  { code: 'he' as const, name: 'עברית', flag: '🇮🇱' },
]

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0].substring(0, 2).toUpperCase()
  }
  if (email) {
    return email.substring(0, 2).toUpperCase()
  }
  return 'U'
}

function UserAvatar({
  avatarUrl,
  name,
  email,
  alt,
}: {
  avatarUrl?: string | null
  name?: string | null
  email?: string | null
  alt: string
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={alt}
        className="h-8 w-8 rounded-full object-cover border-2 border-border"
      />
    )
  }

  return (
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-semibold text-xs border-2 border-border">
      {getInitials(name, email)}
    </div>
  )
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const { user, profile, loading, signInWithGoogle, signOut } = useAuthContext()
  const profileReady = Boolean(profile?.full_name?.trim())
  const displayName = profile?.full_name?.trim() || t('common.user')
  const scrollChrome = useScrollChromeOptional()
  const pageHeaderOverride = usePageHeaderOptional()?.override ?? null
  const headerHidden = scrollChrome?.headerHidden ?? false

  const isSongPage = pathname.includes('/song/')
  const isAddSongPage = pathname === '/add-song'
  const isCreateJamPage = pathname === '/jams/new' || pathname === '/jams/ai'
  const isCreatePlaylistPage = pathname === '/playlists/new'
  const isLibraryPlaylistDetail = pathname.startsWith('/library/')
  const isJamDetail = /^\/jams\/[^/]+$/.test(pathname) && !isCreateJamPage
  const isPlaylistDetail =
    pathname.startsWith('/playlists/') &&
    pathname !== '/playlists/new' &&
    pathname !== '/playlists'

  const showBack =
    isAddSongPage ||
    isCreateJamPage ||
    isCreatePlaylistPage ||
    isLibraryPlaylistDetail ||
    isJamDetail ||
    isPlaylistDetail ||
    pageHeaderOverride !== null

  const hideHeaderOnScroll =
    pathname === '/songs' ||
    pathname === '/' ||
    pathname === '/search' ||
    pathname.startsWith('/search/') ||
    pathname === '/jams' ||
    pathname === '/playlists' ||
    pathname.startsWith('/playlists/') ||
    isSongPage
  const showMenuButton = !isSongPage
  const usesAppSidebar = !!user && !onMenuClick
  const isLandingPage = pathname === '/'
  const currentLanguage = LANGUAGES.find((lang) => lang.code === language) ?? LANGUAGES[0]

  const handleBack = () => {
    if (pageHeaderOverride) {
      router.push(pageHeaderOverride.backHref)
      return
    }
    if (isCreateJamPage || isJamDetail) {
      router.push('/jams')
      return
    }
    if (isCreatePlaylistPage || isPlaylistDetail) {
      router.push('/playlists')
      return
    }
    if (isLibraryPlaylistDetail) {
      router.push('/')
      return
    }
    if (isAddSongPage) {
      router.back()
      return
    }
    router.back()
  }

  const languageMenuItems = (
    <DropdownMenuRadioGroup
      value={language}
      onValueChange={(value) => setLanguage(value as 'en' | 'fr' | 'he')}
    >
      {LANGUAGES.map((lang) => (
        <DropdownMenuRadioItem
          key={lang.code}
          value={lang.code}
          className="pl-2 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground [&>span:first-child]:hidden"
        >
          <span className="flex items-center gap-2">
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )

  const brandMark = (
    <div
      className={cn(
        'pointer-events-none flex min-w-0 select-none items-center gap-0 pe-1',
        usesAppSidebar && 'lg:hidden'
      )}
      aria-hidden
    >
      <AppLogo
        variant="portrait"
        priority={isLandingPage}
        className="h-7 w-7 shrink-0 object-contain sm:h-8 sm:w-8"
      />
      <AppLogo
        variant="text"
        priority={isLandingPage}
        className="-ms-1 h-8 w-auto max-w-[min(13.5rem,58vw)] shrink-0 object-contain object-left sm:-ms-1.5 sm:h-7 sm:max-w-[14rem]"
      />
    </div>
  )

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-11 shrink-0 items-center gap-0.5 overflow-visible bg-background px-2 sm:gap-2 sm:px-3',
        hideHeaderOnScroll && 'max-lg:transition-[transform,margin,height] max-lg:duration-300 max-lg:ease-out',
        hideHeaderOnScroll &&
          headerHidden &&
          'max-lg:-translate-y-full max-lg:-mb-11 max-lg:h-0 max-lg:min-h-0 max-lg:overflow-hidden max-lg:pointer-events-none'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-0.5 sm:gap-1">
        {showMenuButton && user && (
          onMenuClick ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="hidden lg:inline-flex"
              aria-label={t('common.openMenu')}
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : (
            <SidebarTrigger className="hidden lg:flex -ms-1" />
          )
        )}

        {!user && !isLandingPage && (
          <Button variant="ghost" size="icon" className="md:hidden" asChild>
            <Link href="/" aria-label={t('navigation.home')}>
              <Search className="h-5 w-5" />
            </Link>
          </Button>
        )}

        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            className={cn(
              'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-foreground transition-opacity hover:opacity-80 active:opacity-70',
              usesAppSidebar && 'lg:hidden'
            )}
            aria-label={t('common.back')}
          >
            <BackArrowIcon className="h-4 w-4" />
          </button>
        ) : null}

        {brandMark}
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
        {user && <HeaderLevelProgress />}

        {user && <NotificationBell />}

        {!loading && (
          user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-auto w-auto shrink-0 rounded-full p-0 sm:p-1"
                  aria-label={t('navigation.profile')}
                >
                  <UserAvatar
                    avatarUrl={profile?.avatar_url}
                    name={profile?.full_name}
                    email={profile?.email}
                    alt={profile?.full_name || t('common.user')}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className={cn(
                  'w-[min(17.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl p-0',
                  'border border-black/[0.08] bg-white text-foreground shadow-xl',
                  'dark:border-white/[0.1] dark:bg-[#1c1c1c]'
                )}
              >
                <div className="space-y-3 px-3.5 pb-3 pt-3.5">
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-semibold leading-tight">
                      {displayName}
                    </p>
                    {profile?.email ? (
                      <p className="truncate text-xs leading-tight text-muted-foreground">
                        {profile.email}
                      </p>
                    ) : null}
                  </div>
                  <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                    <Link
                      href="/profile"
                      className={cn(
                        'flex h-9 w-full cursor-pointer items-center justify-center rounded-full',
                        'bg-neutral-100 text-sm font-medium text-foreground',
                        'transition-colors hover:bg-neutral-200/90',
                        'dark:bg-white/[0.1] dark:hover:bg-white/[0.14]',
                        'focus:bg-neutral-200/90 dark:focus:bg-white/[0.14]'
                      )}
                    >
                      {profileReady
                        ? t('common.viewProfile')
                        : t('common.setUpProfile')}
                    </Link>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="mx-0 my-0 bg-black/[0.08] dark:bg-white/[0.1]" />

                <div className="py-1">
                  <DropdownMenuItem asChild className="mx-1 cursor-pointer gap-2.5 rounded-lg px-2.5 py-2.5">
                    <Link href="/friends">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {t('navigation.friends')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="mx-1 cursor-pointer gap-2.5 rounded-lg px-2.5 py-2.5">
                    <Link href="/leaderboard">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      {t('navigation.leaderboard')}
                    </Link>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="mx-0 my-0 bg-black/[0.08] dark:bg-white/[0.1]" />

                <div
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                  onPointerDown={(event) => event.preventDefault()}
                >
                  <span className="text-sm text-foreground">{t('common.theme')}</span>
                  <div className="flex rounded-full bg-neutral-100 p-0.5 dark:bg-white/[0.08]">
                    {(
                      [
                        { value: 'light', icon: Sun, label: t('common.lightMode') },
                        { value: 'dark', icon: Moon, label: t('common.darkMode') },
                        { value: 'system', icon: Contrast, label: t('common.systemMode') },
                      ] as const
                    ).map(({ value, icon: Icon, label }) => {
                      const active = theme === value
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-label={label}
                          aria-pressed={active}
                          onClick={() => setTheme(value as ThemePreference)}
                          className={cn(
                            'inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                            active
                              ? 'bg-white text-foreground shadow-sm dark:bg-white/[0.16]'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <DropdownMenuSeparator className="mx-0 my-0 bg-black/[0.08] dark:bg-white/[0.1]" />

                <div className="py-1">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="mx-1 cursor-pointer gap-2.5 rounded-lg px-2.5 py-2.5">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-start">{t('common.language')}</span>
                      <span className="text-xs text-muted-foreground">
                        {currentLanguage.flag}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent
                      className={cn(
                        'w-48 rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg',
                        'dark:border-white/[0.1] dark:bg-[#1c1c1c]'
                      )}
                    >
                      {languageMenuItems}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem
                    onClick={signOut}
                    className="mx-1 cursor-pointer rounded-lg px-2.5 py-2.5"
                  >
                    {t('auth.signOut')}
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-w-9"
                    aria-label={t('common.selectLanguage')}
                  >
                    <Globe className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{t('common.selectLanguage')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {languageMenuItems}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                onClick={() => signInWithGoogle(pathname)}
                className="h-9 gap-1.5 px-3 text-xs font-medium sm:h-8 sm:gap-2 sm:px-3"
              >
                <GoogleIcon className="h-4 w-4 shrink-0" />
                <span className="inline sm:hidden">{t('auth.signIn')}</span>
                <span className="hidden sm:inline">{t('auth.signInWithGoogle')}</span>
              </Button>
            </>
          )
        )}
      </div>
    </header>
  )
}
