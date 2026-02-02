'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { 
  MusicalNoteIcon, 
  PlayIcon,
  ChartBarIcon,
  KeyIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { PlaylistResult, PlaylistSong } from '@/lib/services/playlistGeneratorService';
import { useLanguage } from '@/context/LanguageContext';
import Snackbar from '@/components/Snackbar';

interface PlaylistViewProps {
  playlist: PlaylistResult;
  onSongSelect?: (song: PlaylistSong) => void;
  onCreatePlaylist?: (name: string, playlist: PlaylistResult) => Promise<void>;
}

export default function PlaylistView({ playlist, onSongSelect, onCreatePlaylist }: PlaylistViewProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [showNameModal, setShowNameModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
  };

  const getTransitionColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatKeyAdjustment = (adjustment: number): string => {
    if (adjustment === 0) return '';
    if (adjustment > 0) return `+${adjustment}`;
    return `${adjustment}`;
  };

  // Focus input when modal opens
  useEffect(() => {
    if (showNameModal && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [showNameModal]);

  const handleOpenModal = () => {
    const defaultName = `${t('playlistView.yourPlaylist')} ${new Date().toLocaleString()}`;
    setPlaylistName(defaultName);
    setShowNameModal(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setShowNameModal(false);
    setPlaylistName('');
  };

  const handleSavePlaylist = async () => {
    if (!onCreatePlaylist || !playlistName.trim() || isSaving) return;
    
    setIsSaving(true);
    try {
      await onCreatePlaylist(playlistName.trim(), playlist);
      setShowNameModal(false);
      setPlaylistName('');
      setSnackbarMessage(t('playlistView.playlistSaved'));
      setSnackbarType('success');
      setShowSnackbar(true);
    } catch (e) {
      setSnackbarMessage(t('playlistView.saveError'));
      setSnackbarType('error');
      setShowSnackbar(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSavePlaylist();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCloseModal();
    }
  };

  const handleStartPlaylist = () => {
    if (playlist.songs.length === 0) return;

    // Save playlist context to sessionStorage
    if (typeof window !== 'undefined') {
      const songList = playlist.songs.map(s => s.id);
      const playlistContext = {
        isPlaylist: true,
        targetKey: playlist.keyProgression[0] || '',
        songs: playlist.songs.map(s => ({
          id: s.id,
          keyAdjustment: s.keyAdjustment,
          originalKey: s.originalKey,
          targetKey: s.targetKey
        }))
      };

      const navigationData = {
        songList,
        currentIndex: 0,
        sourceUrl: '/playlist',
        playlistContext
      };

      sessionStorage.setItem('songNavigation', JSON.stringify(navigationData));
      sessionStorage.removeItem('hasUsedNext'); // Reset navigation state

      // Navigate to first song
      router.push(`/song/${playlist.songs[0].id}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('playlistView.yourPlaylist')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {playlist.songs.length} {t('playlistView.songs')} • {Math.round(playlist.estimatedDuration)} {t('playlistView.minutes')}
          </p>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {t('playlistView.score')} <span className="font-medium text-purple-600 dark:text-purple-400">{Math.round(playlist.totalScore * 100)}%</span>
          </div>
          {onCreatePlaylist && (
            <button
              onClick={handleOpenModal}
              className="px-3 py-2 text-xs sm:text-sm rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors active:scale-95 flex-shrink-0"
            >
              {t('playlistView.save')}
            </button>
          )}
        </div>
      </div>

      {/* Start Playlist Button */}
      {playlist.songs.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <button
            onClick={handleStartPlaylist}
            className="w-full flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-purple-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-md active:scale-95"
          >
            <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 flex-shrink-0" />
            <span className="truncate">{t('playlistView.startPlaylist')}</span>
          </button>
          <p className="mt-2 text-[10px] sm:text-xs text-center text-gray-500 dark:text-gray-400 px-1">
            {t('playlistView.startPlaylistDescription')}
          </p>
        </div>
      )}

      {/* Playlist Info */}
      {playlist.keyProgression.length > 0 && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center flex-wrap gap-2">
              <KeyIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <span className="font-medium text-purple-900 dark:text-purple-200">{t('playlistView.playlistKey')}</span>
              <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-semibold text-xs">
                {playlist.keyProgression[0]}
              </span>
            </div>
            <div className="text-purple-700 dark:text-purple-300 text-xs sm:text-sm">
              {t('playlistView.allSongsTransposed')}
            </div>
          </div>
        </div>
      )}

      {/* Song List */}
      <div className="space-y-2 max-h-96 overflow-y-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        {playlist.songs.map((song, index) => (
          <div
            key={song.id}
            onClick={() => onSongSelect?.(song)}
            className="flex items-start sm:items-center p-2.5 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors active:scale-[0.98]"
          >
            <div className="flex-shrink-0 mr-2 sm:mr-3">
              {song.songImageUrl ? (
                <img 
                  src={song.songImageUrl} 
                  alt={song.title}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                />
              ) : (
                <MusicalNoteIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {song.title}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {song.author}
                  </p>
                </div>
                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium flex-shrink-0 ml-2">
                  #{index + 1}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-1 flex-wrap">
                {/* Original Key */}
                {song.originalKey && song.originalKey !== 'Unknown' && (
                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                    <KeyIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                    <span className="hidden sm:inline">{t('playlistView.original')} </span>
                    {song.originalKey}
                  </span>
                )}
                
                {/* Key Adjustment */}
                {song.keyAdjustment !== 0 && (
                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    <ArrowRightIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                    {formatKeyAdjustment(song.keyAdjustment)} <span className="hidden sm:inline">{t('playlistView.semitones')}</span>
                  </span>
                )}
                
                {/* Target Key */}
                {song.targetKey && song.targetKey !== 'Unknown' && (
                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                    <KeyIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                    <span className="hidden sm:inline">{t('playlistView.target')} </span>
                    {song.targetKey}
                  </span>
                )}
                
                {/* Compatibility Score */}
                <span className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full ${getScoreColor(song.compatibilityScore)} dark:bg-opacity-20`}>
                  <span className="hidden sm:inline">{t('playlistView.compatibility')} </span>
                  {Math.round(song.compatibilityScore * 100)}%
                </span>
                
                {/* Transition Score */}
                {index > 0 && (
                  <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${getTransitionColor(song.transitionScore)} bg-opacity-20 dark:bg-opacity-20`}>
                    <span className="hidden sm:inline">{t('playlistView.transition')} </span>
                    {Math.round(song.transitionScore * 100)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {playlist.songs.length === 0 && (
        <div className="text-center py-12">
          <MusicalNoteIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('playlistView.noSongsInPlaylist')}</p>
        </div>
      )}

      {/* Playlist Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-end sm:items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg rounded-t-2xl sm:rounded-lg animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                {t('playlistView.playlistName')}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                disabled={isSaving}
                aria-label={t('common.close')}
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-4">
                <label htmlFor="playlist-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('playlistView.playlistName')}
                </label>
                <input
                  id="playlist-name"
                  ref={inputRef}
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSaving}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder={t('playlistView.playlistNamePlaceholder')}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm sm:text-base font-medium rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 transition-colors active:scale-95"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSavePlaylist}
                  disabled={isSaving || !playlistName.trim()}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 bg-gray-600 text-white text-sm sm:text-base font-medium rounded-lg shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors active:scale-95"
                >
                  {isSaving ? t('playlistView.saving') : t('playlistView.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      <Snackbar
        message={snackbarMessage || ''}
        isOpen={showSnackbar}
        onClose={() => setShowSnackbar(false)}
        type={snackbarType}
      />
    </div>
  );
}

