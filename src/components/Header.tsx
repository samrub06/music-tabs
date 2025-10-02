'use client';

import { Bars3Icon } from '@heroicons/react/24/outline';
import { usePathname, useRouter } from 'next/navigation';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isSongPage = pathname.startsWith('/song/');
  const showMenuButton = !isSongPage;

  const handleLogoClick = () => {
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Mobile menu button */}
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}
          
          {/* Logo - Centered on mobile when no menu button, left-aligned on desktop */}
          <button 
            onClick={handleLogoClick}
            className={`flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer ${showMenuButton ? 'lg:mx-auto' : 'mx-auto'}`}
            aria-label="Retour à la page principale"
          >
            <span className="text-xl md:text-2xl">🎸</span>
            <span className="text-lg font-semibold text-gray-900">
              Music Tabs
            </span>
          </button>
          
          {/* Spacer for mobile menu button alignment */}
          {showMenuButton && <div className="w-10 lg:hidden"></div>}
        </div>
      </div>
    </header>
  );
}
