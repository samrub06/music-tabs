'use client'

import { useAuthContext } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Menu,
  Search,
  Trophy,
  Sun,
  Moon,
  LogOut,
  User,
} from 'lucide-react'
import CompactStatsDisplay from './gamification/CompactStatsDisplay'
import { SidebarTrigger } from '@/components/ui/sidebar'
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

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined
): string {
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

export default function Header({ onMenuClick, pageTitle }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const { user, profile, loading, signInWithGoogle, signOut } = useAuthContext()

  const isSongPage = pathname.includes('/song/')
  const showMenuButton = !isSongPage
  const usesAppSidebar = !!user && !onMenuClick
  const currentLanguage =
    LANGUAGES.find((lang) => lang.code === language) ?? LANGUAGES[0]

  const handleLogoClick = () => {
    router.push('/search')
  }

  return (
    <header className="flex-shrink-0 border-b border-border bg-transparent lg:bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:h-16 sm:px-6 lg:max-w-none lg:px-4">
        {/* Left */}
        <div className="flex items-center gap-1 md:gap-2">
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
            <Button asChild variant="ghost" size="icon" className="md:hidden">
              <Link href="/search">
                <Search className="h-5 w-5" />
                <span className="sr-only">{t('navigation.search')}</span>
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile page title */}
        {pageTitle && (
          <div className="flex-1 lg:hidden">
            <h1 className="text-left text-lg font-semibold text-foreground">
              {pageTitle}
            </h1>
          </div>
        )}

        {/* Logo */}
        <button
          type="button"
          onClick={handleLogoClick}
          aria-label={t('common.backToHome')}
          className={cn(
            'absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 transition-opacity hover:opacity-80 sm:gap-2',
            usesAppSidebar && 'lg:hidden'
          )}
        >
          <span className="text-xl md:text-2xl">🌶️</span>
          <span className="hidden text-lg font-semibold text-foreground sm:inline">
            {t('common.appName')}
          </span>
        </button>

        {/* Right */}
        <div className="flex items-center gap-1 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-w-9"
                aria-label={t('common.selectLanguage')}
              >
                <span className="text-base sm:text-lg">{currentLanguage.flag}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuRadioGroup
                value={language}
                onValueChange={(value) =>
                  setLanguage(value as 'en' | 'fr' | 'he')
                }
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
            <Button asChild variant="ghost" size="icon" className="lg:hidden">
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
                    className="h-9 w-9 rounded-full p-0"
                    aria-label={t('navigation.profile')}
                  >
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || t('common.user')}
                        className="h-8 w-8 rounded-full border-2 border-border object-cover sm:h-9 sm:w-9"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white sm:h-9 sm:w-9 sm:text-sm">
                        {getInitials(profile?.full_name, profile?.email)}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-medium">
                      {profile?.full_name || t('common.user')}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {profile?.email}
                    </p>
                    <div className="mt-2">
                      <CompactStatsDisplay />
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User />
                      {t('navigation.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun /> : <Moon />}
                    {theme === 'dark'
                      ? t('common.lightMode')
                      : t('common.darkMode')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut />
                    {t('auth.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={signInWithGoogle}
                title={t('auth.signInWithGoogle')}
                className="gap-2"
              >
                <GoogleIcon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{t('auth.signInWithGoogle')}</span>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  )
}
