'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useLandscapeMobile } from '@/lib/hooks/useLandscapeMobile';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  RectangleStackIcon,
  HomeIcon,
  EllipsisHorizontalIcon,
  FolderIcon,
  MusicalNoteIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  RectangleStackIcon as RectangleStackIconSolid,
  HomeIcon as HomeIconSolid,
  EllipsisHorizontalIcon as EllipsisHorizontalIconSolid,
  FolderIcon as FolderIconSolid,
  MusicalNoteIcon as MusicalNoteIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
} from '@heroicons/react/24/solid';
import MoreMenu from './MoreMenu';

const MORE_PATHS = ['/leaderboard', '/profile', '/jams', '/friends'];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const { t } = useLanguage();
  const isLandscapeMobile = useLandscapeMobile();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) {
    return null;
  }

  const isMoreActive = MORE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  const navItems = [
    {
      href: '/',
      label: t('navigation.home'),
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      isActive: pathname === '/',
    },
    {
      href: '/search',
      label: t('navigation.search'),
      icon: MagnifyingGlassIcon,
      iconSolid: MagnifyingGlassIconSolid,
      isActive: pathname === '/search' || pathname.startsWith('/search/'),
    },
    {
      href: '/songs',
      label: t('navigation.songs'),
      icon: RectangleStackIcon,
      iconSolid: RectangleStackIconSolid,
      isActive: pathname === '/songs' || pathname.startsWith('/songs/'),
    },
    {
      href: '/playlists',
      label: t('navigation.folders'),
      icon: FolderIcon,
      iconSolid: FolderIconSolid,
      isActive: pathname === '/playlists' || pathname.startsWith('/playlists/'),
    },
    {
      href: '/chords',
      label: t('navigation.chords'),
      icon: MusicalNoteIcon,
      iconSolid: MusicalNoteIconSolid,
      isActive: pathname === '/chords' || pathname.startsWith('/chords/'),
    },
  ];

  const iconClass = cn(
    'flex-shrink-0',
    isLandscapeMobile ? 'h-4 w-4' : 'h-5 w-5'
  );

  const chrome = (
    <>
      <nav
        aria-label={t('navigation.MENU')}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 lg:hidden',
          'px-3 pb-[max(0.55rem,env(safe-area-inset-bottom,0px))]'
        )}
      >
        {/* Stacked plates behind the main pill */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-x-5 bottom-[max(0.35rem,env(safe-area-inset-bottom,0px))]',
            isLandscapeMobile ? 'h-9' : 'h-14',
            'rounded-[1.55rem] bg-white/15 dark:bg-white/[0.03]',
            'ring-1 ring-black/[0.03] dark:ring-white/[0.05]',
            'translate-y-1.5 scale-[0.97] blur-[0.3px]'
          )}
        />
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-x-4 bottom-[max(0.45rem,env(safe-area-inset-bottom,0px))]',
            isLandscapeMobile ? 'h-10' : 'h-[3.75rem]',
            'rounded-[1.65rem] bg-white/20 dark:bg-white/[0.04]',
            'ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
            'translate-y-0.5 scale-[0.985]'
          )}
        />

        <div
          className={cn(
            'relative mx-auto max-w-lg overflow-hidden rounded-[1.75rem]',
            'border border-white/25 bg-white/25 text-foreground backdrop-blur-2xl',
            'dark:border-white/[0.12] dark:bg-white/[0.08]',
            'shadow-[0_-4px_24px_-6px_rgba(0,0,0,0.10),0_10px_28px_-12px_rgba(0,0,0,0.12)]',
            'dark:shadow-[0_-4px_28px_-8px_rgba(0,0,0,0.35),0_12px_32px_-14px_rgba(0,0,0,0.4)]'
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/15"
          />
          <div
            className={cn(
              'relative flex items-stretch px-1',
              isLandscapeMobile ? 'h-10' : 'h-16'
            )}
          >
            {navItems.map((item) => {
              const IconComponent = item.isActive ? item.iconSolid : item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    'flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-0.5 transition-all duration-200 active:scale-95',
                    isLandscapeMobile ? 'py-0' : 'py-1',
                    item.isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <IconComponent className={iconClass} />
                  {!isLandscapeMobile ? (
                    <span
                      className={cn(
                        'mt-0.5 w-full truncate text-center text-[10px] sm:text-xs',
                        item.isActive ? 'font-semibold' : 'font-medium'
                      )}
                    >
                      {item.label}
                    </span>
                  ) : null}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((open) => !open)}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-0.5 transition-all duration-200 active:scale-95',
                isLandscapeMobile ? 'py-0' : 'py-1',
                isMoreActive || isMoreMenuOpen
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={t('navigation.more')}
            >
              {isMoreActive || isMoreMenuOpen ? (
                <EllipsisHorizontalIconSolid className={iconClass} />
              ) : (
                <EllipsisHorizontalIcon className={iconClass} />
              )}
              {!isLandscapeMobile ? (
                <span
                  className={cn(
                    'mt-0.5 w-full truncate text-center text-[10px] sm:text-xs',
                    isMoreActive || isMoreMenuOpen ? 'font-semibold' : 'font-medium'
                  )}
                >
                  {t('navigation.more')}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </nav>
      <MoreMenu
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
      />
    </>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(chrome, document.body);
}
