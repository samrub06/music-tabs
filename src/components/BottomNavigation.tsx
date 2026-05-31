'use client';

import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  RectangleStackIcon, 
  SparklesIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { 
  RectangleStackIcon as RectangleStackIconSolid, 
  SparklesIcon as SparklesIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  EllipsisHorizontalIcon as EllipsisHorizontalIconSolid,
} from '@heroicons/react/24/solid';
import MoreMenu from './MoreMenu';
import { useFoldersContext } from '@/context/FoldersContext';

const MORE_PATHS = ['/folders', '/chords', '/leaderboard', '/profile', '/ai-playlist'];

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
      label: t('navigation.playlists'),
      icon: SparklesIcon,
      iconSolid: SparklesIconSolid,
      isActive: pathname === '/playlists' || pathname.startsWith('/playlists/') || pathname.startsWith('/playlist/'),
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-black/[0.06] dark:border-white/[0.08] lg:hidden safe-area-inset-bottom">
        <div className="flex items-stretch h-16 px-1">
          {navItems.map((item) => {
            const IconComponent = item.isActive ? item.iconSolid : item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 px-1 py-1 rounded-lg transition-all duration-150 active:scale-95 ${
                  item.isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <IconComponent className="h-6 w-6 flex-shrink-0" />
                <span className={`text-xs mt-0.5 truncate w-full text-center ${
                  item.isActive ? 'font-semibold' : 'font-medium'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setIsMoreMenuOpen((open) => !open)}
            className={`flex flex-col items-center justify-center flex-1 min-w-0 px-1 py-1 rounded-lg transition-all duration-150 active:scale-95 ${
              isMoreActive || isMoreMenuOpen
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            aria-label={t('navigation.more')}
          >
            {isMoreActive || isMoreMenuOpen ? (
              <EllipsisHorizontalIconSolid className="h-6 w-6 flex-shrink-0" />
            ) : (
              <EllipsisHorizontalIcon className="h-6 w-6 flex-shrink-0" />
            )}
            <span className={`text-xs mt-0.5 truncate w-full text-center ${
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
