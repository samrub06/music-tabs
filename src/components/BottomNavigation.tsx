'use client';

import { useState } from 'react';
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
import { useFoldersContext } from '@/context/FoldersContext';

const MORE_PATHS = ['/leaderboard', '/profile', '/ai-playlist'];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const { t } = useLanguage();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const { folders } = useFoldersContext();

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
      label: t('navigation.playlists'),
      icon: QueueListIcon,
      iconSolid: QueueListIconSolid,
      isActive: pathname === '/playlists' || pathname.startsWith('/playlists/') || pathname.startsWith('/playlist/'),
    },
    {
      href: '/folders',
      label: t('navigation.folders'),
      icon: FolderIcon,
      iconSolid: FolderIconSolid,
      isActive: pathname === '/folders' || pathname.startsWith('/folders/'),
    },
    {
      href: '/chords',
      label: t('navigation.chords'),
      icon: MusicalNoteIcon,
      iconSolid: MusicalNoteIconSolid,
      isActive: pathname === '/chords' || pathname.startsWith('/chords/'),
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 lg:hidden safe-area-inset-bottom">
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
        folders={folders}
      />
    </>
  );
}
