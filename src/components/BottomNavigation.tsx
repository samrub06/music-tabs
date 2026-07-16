'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  RectangleStackIcon, 
  QueueListIcon,
  HomeIcon,
  EllipsisHorizontalIcon,
  FolderIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';
import { 
  RectangleStackIcon as RectangleStackIconSolid, 
  QueueListIcon as QueueListIconSolid,
  HomeIcon as HomeIconSolid,
  EllipsisHorizontalIcon as EllipsisHorizontalIconSolid,
  FolderIcon as FolderIconSolid,
  MusicalNoteIcon as MusicalNoteIconSolid,
} from '@heroicons/react/24/solid';
import MoreMenu from './MoreMenu';

const MORE_PATHS = ['/leaderboard', '/profile', '/jams/ai', '/friends'];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const { t } = useLanguage();
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
      isActive: pathname === '/' || pathname === '/search' || pathname.startsWith('/search/'),
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
    {
      href: '/jams',
      label: t('navigation.playlists'),
      icon: QueueListIcon,
      iconSolid: QueueListIconSolid,
      isActive: pathname === '/jams' || pathname.startsWith('/jams/'),
    },
  ];

  const chrome = (
    <>
      <nav
        aria-label={t('navigation.MENU')}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background lg:hidden safe-area-inset-bottom"
      >
        <div className="flex items-stretch h-16 px-0.5">
          {navItems.map((item) => {
            const IconComponent = item.isActive ? item.iconSolid : item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 px-0.5 py-1 rounded-lg transition-all duration-150 active:scale-95 ${
                  item.isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <IconComponent className="h-5 w-5 flex-shrink-0" />
                <span className={`text-[10px] sm:text-xs mt-0.5 truncate w-full text-center ${
                  item.isActive ? 'font-semibold' : 'font-medium'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen((open) => !open)}
            className={`flex flex-col items-center justify-center flex-1 min-w-0 px-0.5 py-1 rounded-lg transition-all duration-150 active:scale-95 ${
              isMoreActive || isMoreMenuOpen
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label={t('navigation.more')}
          >
            {isMoreActive || isMoreMenuOpen ? (
              <EllipsisHorizontalIconSolid className="h-5 w-5 flex-shrink-0" />
            ) : (
              <EllipsisHorizontalIcon className="h-5 w-5 flex-shrink-0" />
            )}
            <span className={`text-[10px] sm:text-xs mt-0.5 truncate w-full text-center ${
              isMoreActive || isMoreMenuOpen ? 'font-semibold' : 'font-medium'
            }`}>
              {t('navigation.more')}
            </span>
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
