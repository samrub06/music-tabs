'use client';

import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowRightOnRectangleIcon, Bars3Icon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import PlaylistImporter from './PlaylistImporter';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { user, profile, loading, signInWithGoogle, signOut } = useAuthContext();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPlaylistImporter, setShowPlaylistImporter] = useState(false);
  
  const isSongPage = pathname.includes('/song/');
  const showMenuButton = !isSongPage;

  const handleLogoClick = () => {
    router.push('/');
  };

  const handleLanguageChange = (newLanguage: 'en' | 'fr' | 'he') => {
    setLanguage(newLanguage);
    setShowLanguageMenu(false);
  };

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
    { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
    { code: 'he' as const, name: 'עברית', flag: '🇮🇱' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  // Générer les initiales de l'utilisateur
  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
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
              aria-label={t('common.openMenu')}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}
          
          {/* Logo - Always centered */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer mx-auto"
            aria-label={t('common.backToHome')}
          >
            <span className="text-xl md:text-2xl">🎸</span>
            <span className="text-lg font-semibold text-gray-900">
              {t('common.appName')}
            </span>
          </button>
          
          {/* Right side: Auth + Language */}
          <div className="flex items-center space-x-2">
            {/* User menu */}
            {!loading && (
              <div className="relative">
                {user ? (
                  <>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.full_name || 'User'} 
                          className="h-9 w-9 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200">
                          {getInitials(profile?.full_name, profile?.email)}
                        </div>
                      )}
                    </button>
                    
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {profile?.full_name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {profile?.email}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowPlaylistImporter(true);
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <CloudArrowDownIcon className="h-5 w-5" />
                          <span>Importer Ultimate Guitar</span>
                        </button>
                        <button
                          onClick={() => {
                            signOut();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5" />
                          <span>{t('auth.signOut')}</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={signInWithGoogle}
                    className="flex items-center space-x-2 px-2 sm:px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    title={t('auth.signInWithGoogle')}
                  >
                    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
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
                    <span className="hidden sm:inline">{t('auth.signInWithGoogle')}</span>
                  </button>
                )}
              </div>
            )}
            
            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center space-x-1 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label={t('common.selectLanguage')}
              >
                <span className="text-lg font-medium">{currentLanguage.flag}</span>
              </button>
              
              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                        language.code === currentLanguage.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span>{language.flag}</span>
                      <span>{language.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Playlist Importer Modal */}
        {showPlaylistImporter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Importer Ultimate Guitar</h2>
                <button
                  onClick={() => setShowPlaylistImporter(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <PlaylistImporter
                  onImportComplete={(result) => {
                    console.log('Import completed:', result);
                    // Optionally refresh the song list or show success message
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
