'use client';

import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  RectangleStackIcon, 
  FolderIcon, 
  MusicalNoteIcon,
  SparklesIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { 
  RectangleStackIcon as RectangleStackIconSolid, 
  FolderIcon as FolderIconSolid, 
  MusicalNoteIcon as MusicalNoteIconSolid,
  SparklesIcon as SparklesIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid
} from '@heroicons/react/24/solid';
import CreateMenu from './CreateMenu';
import { useFoldersContext } from '@/context/FoldersContext';

export default function BottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const { t } = useLanguage();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const { folders } = useFoldersContext();

  // Only show for authenticated users
  if (!user) {
    return null;
  }

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
      href: '/folders',
      label: t('navigation.folders'),
      icon: FolderIcon,
      iconSolid: FolderIconSolid,
      isActive: pathname === '/folders' || pathname.startsWith('/folders/'),
    },
    {
      href: '/playlists',
      label: t('navigation.playlists'),
      icon: SparklesIcon,
      iconSolid: SparklesIconSolid,
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

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 lg:hidden safe-area-inset-bottom">
        <div className="flex items-center justify-between h-16 px-2 gap-1">
          {navItems.map((item) => {
            const IconComponent = item.isActive ? item.iconSolid : item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 px-1 py-1 rounded-lg transition-all duration-150 active:scale-95 active:bg-gray-100 dark:active:bg-gray-800 ${
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
            onClick={() => (isCreateMenuOpen ? setIsCreateMenuOpen(false) : setIsCreateMenuOpen(true))}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-transform duration-150 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-90 shadow-lg"
            aria-label={isCreateMenuOpen ? t('common.close') ?? 'Fermer' : t('common.create')}
          >
            {isCreateMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <PlusIcon className="h-6 w-6" />}
          </button>
        </div>
      </nav>
      <CreateMenu
        isOpen={isCreateMenuOpen}
        onClose={() => setIsCreateMenuOpen(false)}
        folders={folders}
      />
    </>
  );
}

