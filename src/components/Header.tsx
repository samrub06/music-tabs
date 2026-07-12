'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Globe,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  User,
} from 'lucide-react'
import { BackArrowIcon } from '@/components/icons/DirectionalIcons'
import { useAuthContext } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useScrollChromeOptional } from '@/context/ScrollChromeContext'
import { usePageHeaderOptional } from '@/context/PageHeaderContext'
import { useTheme } from '@/context/ThemeContext'
import { AppLogo } from '@/components/AppLogo'
import CompactStatsDisplay from './gamification/CompactStatsDisplay'
import HeaderLevelProgress from './gamification/HeaderLevelProgress'
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
  pageTitle?: string
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

export default function Header({ onMenuClick, pageTitle }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const { user, profile, loading, signInWithGoogle, signOut } = useAuthContext()
  const scrollChrome = useScrollChromeOptional()
  const pageHeaderOverride = usePageHeaderOptional()?.override ?? null
  const headerHidden = scrollChrome?.headerHidden ?? false

  const isSongPage = pathname.includes('/song/')
  const isAddSongPage = pathname === '/add-song'
  const isCreatePlaylistPage = pathname === '/playlist'
  const showBackWithTitle =
    isAddSongPage || isCreatePlaylistPage || pageHeaderOverride !== null
  const hideHeaderOnScroll =
    pathname === '/songs' ||
    pathname === '/' ||
    pathname === '/search' ||
    pathname.startsWith('/search/') ||
    pathname === '/playlists' ||
    pathname === '/folders' ||
    pathname.startsWith('/folders/') ||
    isSongPage
  const showMenuButton = !isSongPage
  const usesAppSidebar = !!user && !onMenuClick
  const isLandingPage = pathname === '/'
  const currentLanguage = LANGUAGES.find((lang) => lang.code === language) ?? LANGUAGES[0]

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
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
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

        {!user && (
          <Button variant="ghost" size="icon" className="md:hidden" asChild>
            <Link href="/" aria-label={t('navigation.home')}>
              <Search className="h-5 w-5" />
            </Link>
          </Button>
        )}

        {showBackWithTitle ? (
          <button
            type="button"
            onClick={() => {
              if (pageHeaderOverride) {
                router.push(pageHeaderOverride.backHref)
              } else if (isCreatePlaylistPage) {
                router.push('/playlists')
              } else {
                router.back()
              }
            }}
            className="flex min-w-0 items-center gap-0.5 text-foreground -ms-1 py-1 pe-2 ps-1 rounded-lg hover:opacity-80 active:opacity-70 transition-opacity"
            aria-label={t('common.back')}
          >
            <BackArrowIcon className="h-5 w-5 shrink-0" />
            <h1 className="truncate text-base font-semibold">
              {pageHeaderOverride?.title ??
                (isCreatePlaylistPage
                  ? t('createMenu.createPlaylist')
                  : t('navigation.addSong'))}
            </h1>
          </button>
        ) : (
          pageTitle && (
            <h1 className="truncate text-base font-semibold text-foreground lg:hidden">
              {pageTitle}
            </h1>
          )
        )}
      </div>

      <Link
        href="/"
        className={cn(
          'absolute left-1/2 z-10 -translate-x-1/2 overflow-visible px-1 sm:px-3',
          usesAppSidebar && 'lg:hidden',
          showBackWithTitle && 'hidden'
        )}
        aria-label={t('common.backToHome')}
      >
        <AppLogo
          variant="portrait"
          priority={isLandingPage}
          className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
        />
      </Link>

      <div className="flex flex-1 items-center justify-end gap-0 sm:gap-2">
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
                className="w-[min(14rem,calc(100vw-1.5rem))]"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex min-w-0 flex-col space-y-1">
                    <p className="truncate text-sm font-medium leading-none">
                      {profile?.full_name || t('common.user')}
                    </p>
                    <p className="truncate text-xs leading-none text-muted-foreground">
                      {profile?.email}
                    </p>
                  </div>
                  <div className="mt-2 min-w-0 border-t border-border pt-2">
                    <CompactStatsDisplay />
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="h-4 w-4" />
                    {t('navigation.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Globe className="h-4 w-4" />
                    {t('common.selectLanguage')}
                    <span className="ms-auto text-xs text-muted-foreground">
                      {currentLanguage.flag}
                    </span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {languageMenuItems}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  {t('auth.signOut')}
                </DropdownMenuItem>
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
