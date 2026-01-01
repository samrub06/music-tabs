'use client';

import { useAuthContext } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  GlobeAltIcon, 
  RectangleStackIcon, 
  FolderIcon, 
  MusicalNoteIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  GlobeAltIcon as GlobeAltIconSolid, 
  RectangleStackIcon as RectangleStackIconSolid, 
  FolderIcon as FolderIconSolid, 
  MusicalNoteIcon as MusicalNoteIconSolid,
  SparklesIcon as SparklesIconSolid
} from '@heroicons/react/24/solid';

export default function BottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuthContext();

  // Only show for authenticated users
  if (!user) {
    return null;
  }

  const navItems = [
    {
      href: '/library',
      label: 'Library',
      icon: GlobeAltIcon,
      iconSolid: GlobeAltIconSolid,
      isActive: pathname === '/library' || pathname.startsWith('/library/'),
    },
    {
      href: '/songs',
      label: 'Songs',
      icon: RectangleStackIcon,
      iconSolid: RectangleStackIconSolid,
      isActive: pathname === '/songs' || pathname.startsWith('/songs/'),
    },
    {
      href: '/folders',
      label: 'Folders',
      icon: FolderIcon,
      iconSolid: FolderIconSolid,
      isActive: pathname === '/folders' || pathname.startsWith('/folders/'),
    },
    {
      href: '/playlists',
      label: 'Playlists',
      icon: SparklesIcon,
      iconSolid: SparklesIconSolid,
      isActive: pathname === '/playlists' || pathname.startsWith('/playlists/'),
    },
    {
      href: '/chords',
      label: 'Chords',
      icon: MusicalNoteIcon,
      iconSolid: MusicalNoteIconSolid,
      isActive: pathname === '/chords' || pathname.startsWith('/chords/'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 lg:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const IconComponent = item.isActive ? item.iconSolid : item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 px-2 py-1 rounded-lg transition-colors ${
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
      </div>
    </nav>
  );
}

