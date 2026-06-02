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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-foreground">
            {t('playlistView.yourPlaylist')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {playlist.songs.length} {t('playlistView.songs')} • {Math.round(playlist.estimatedDuration)} {t('playlistView.minutes')}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="text-xs text-muted-foreground">
            {t('playlistView.score')}{' '}
            <span className="font-medium text-primary">{Math.round(playlist.totalScore * 100)}%</span>
          </div>
          {onCreatePlaylist && (
            <Button type="button" variant="secondary" size="sm" onClick={handleOpenModal}>
              {t('playlistView.save')}
            </Button>
          )}
        </div>
      </div>

      {playlist.songs.length > 0 && (
        <Button type="button" className="w-full mb-4" size="lg" onClick={handleStartPlaylist}>
          <PlayIcon className="h-5 w-5" />
          {t('playlistView.startPlaylist')}
        </Button>
      )}

      {playlist.keyProgression.length > 0 && (
        <div className="mb-4 rounded-lg border border-border bg-muted/40 p-3 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <KeyIcon className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-foreground">{t('playlistView.playlistKey')}</span>
            <span className="rounded-md border border-border bg-background px-2 py-0.5 font-semibold text-foreground text-xs">
              {playlist.keyProgression[0]}
            </span>
            <span className="text-muted-foreground">{t('playlistView.allSongsTransposed')}</span>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {playlist.songs.map((song, index) => (
          <div
            key={song.id}
            onClick={() => onSongSelect?.(song)}
            className="flex items-start sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-border bg-background/50 hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <div className="flex-shrink-0 mr-2 sm:mr-3">
              {song.songImageUrl ? (
                <img 
                  src={song.songImageUrl} 
                  alt={song.title}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                />
              ) : (
                <MusicalNoteIcon className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-medium text-foreground truncate">
                    {song.title}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">
                    {song.author}
                  </p>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium flex-shrink-0 ml-2">
                  #{index + 1}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-1 flex-wrap">
                {/* Original Key */}
                {song.originalKey && song.originalKey !== 'Unknown' && (
                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-muted text-muted-foreground rounded-full">
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
                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-primary/10 text-primary rounded-full">
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
          <MusicalNoteIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t('playlistView.noSongsInPlaylist')}</p>
        </div>
      )}

      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-base font-semibold text-foreground">
                {t('playlistView.playlistName')}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCloseModal}
                disabled={isSaving}
                aria-label={t('common.close')}
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playlist-name">{t('playlistView.playlistName')}</Label>
                <Input
                  id="playlist-name"
                  ref={inputRef}
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSaving}
                  placeholder={t('playlistView.playlistNamePlaceholder')}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSaving}>
                  {t('common.cancel')}
                </Button>
                <Button
                  type="button"
                  onClick={handleSavePlaylist}
                  disabled={isSaving || !playlistName.trim()}
                >
                  {isSaving ? t('playlistView.saving') : t('playlistView.save')}
                </Button>
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

