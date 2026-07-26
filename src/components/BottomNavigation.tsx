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
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background lg:hidden safe-area-inset-bottom"
      >
        <div
          className={cn(
            'flex items-stretch px-0.5',
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
                  'flex flex-1 min-w-0 flex-col items-center justify-center rounded-lg px-0.5 transition-all duration-150 active:scale-95',
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
              'flex flex-1 min-w-0 flex-col items-center justify-center rounded-lg px-0.5 transition-all duration-150 active:scale-95',
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
