'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  Trophy,
  User,
} from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useScrollChromeOptional } from '@/context/ScrollChromeContext'
import { useTheme } from '@/context/ThemeContext'
import CompactStatsDisplay from './gamification/CompactStatsDisplay'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
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
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs border-2 border-border">
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
  const headerHidden = scrollChrome?.headerHidden ?? false

  const isSongPage = pathname.includes('/song/')
  const isAddSongPage = pathname === '/add-song'
  const hideHeaderOnScroll =
    pathname === '/songs' || pathname === '/search' || pathname.startsWith('/search/')
  const showMenuButton = !isSongPage
  const usesAppSidebar = !!user && !onMenuClick
  const currentLanguage = LANGUAGES.find((lang) => lang.code === language) || LANGUAGES[0]

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-11 shrink-0 items-center gap-2 bg-background px-3',
        hideHeaderOnScroll && 'max-lg:transition-[transform,margin,height] max-lg:duration-300 max-lg:ease-out',
        hideHeaderOnScroll &&
          headerHidden &&
          'max-lg:-translate-y-full max-lg:-mb-11 max-lg:h-0 max-lg:min-h-0 max-lg:overflow-hidden max-lg:pointer-events-none'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
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
            <SidebarTrigger className="hidden lg:flex -ml-1" />
          )
        )}

        {!user && (
          <Button variant="ghost" size="icon" className="md:hidden" asChild>
            <Link href="/search" aria-label={t('navigation.search')}>
              <Search className="h-5 w-5" />
            </Link>
          </Button>
        )}

        {isAddSongPage ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="flex min-w-0 items-center gap-0.5 text-foreground -ml-1 py-1 pr-2 rounded-lg hover:opacity-80 active:opacity-70 transition-opacity"
            aria-label={t('common.back')}
          >
            <ChevronLeft className="h-6 w-6 shrink-0" aria-hidden />
            <h1 className="truncate text-base font-semibold">
              {t('navigation.addSong')}
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

      <Button
        type="button"
        variant="ghost"
        onClick={() => router.push('/search')}
        className={cn(
          'absolute left-1/2 -translate-x-1/2 gap-1.5 px-2 hover:bg-transparent sm:gap-2 sm:px-3',
          usesAppSidebar && 'lg:hidden',
          isAddSongPage && 'hidden'
        )}
        aria-label={t('common.backToHome')}
      >
        <span className="text-lg md:text-xl leading-none">🌶️</span>
        <span className="hidden text-base font-semibold sm:inline">{t('common.appName')}</span>
      </Button>

      <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="min-w-9 text-base sm:text-lg"
              aria-label={t('common.selectLanguage')}
            >
              {currentLanguage.flag}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{t('common.selectLanguage')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={language}
              onValueChange={(value) => setLanguage(value as 'en' | 'fr' | 'he')}
            >
              {LANGUAGES.map((lang) => (
                <DropdownMenuRadioItem key={lang.code} value={lang.code}>
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {user && (
          <Button variant="ghost" size="icon" className="lg:hidden" asChild>
            <Link href="/leaderboard" aria-label={t('navigation.leaderboard')}>
              <Trophy className="h-5 w-5" />
            </Link>
          </Button>
        )}

        {!loading && (
          user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full p-0.5 sm:p-1 h-auto w-auto"
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
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">
                      {profile?.full_name || t('common.user')}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {profile?.email}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border">
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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  {t('auth.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={signInWithGoogle} className="gap-2">
              <GoogleIcon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t('auth.signInWithGoogle')}</span>
            </Button>
          )
        )}
      </div>
    </header>
  )
}
