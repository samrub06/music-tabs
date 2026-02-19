'use client';

import { Song } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import {
  ArrowLeftIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  MusicalNoteIcon,
  ArrowRightIcon,
  CheckIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SongHeaderProps {
  song: Song;
  autoScroll: {
    isActive: boolean;
    speed: number;
  };
  onNavigateBack: () => void;
  onToggleAutoScroll: () => void;
  onSetAutoScrollSpeed: (speed: number) => void;
  onResetScroll: () => void;
  onPrevSong?: () => void;
  onNextSong?: () => void;
  canPrevSong?: boolean;
  canNextSong?: boolean;
  nextSongInfo?: { title: string; author?: string } | null;
  isInLibrary?: boolean;
  onAddToLibrary?: () => void;
  onToggleToolsBar?: () => void;
}

export default function SongHeader({
  song,
  autoScroll,
  onNavigateBack,
  onToggleAutoScroll,
  onSetAutoScrollSpeed,
  onResetScroll,
  onPrevSong,
  onNextSong,
  canPrevSong,
  canNextSong,
  nextSongInfo,
  isInLibrary,
  onAddToLibrary,
  onToggleToolsBar,
}: SongHeaderProps) {
  const { t } = useLanguage();
  const showAddToLibrary = !isInLibrary && onAddToLibrary;

  return (
    <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-background relative">
      {/* Row 1: Back, cover+title+artist, prev/next, library check, dropdown (Add to library only) */}
      <div className="flex items-center justify-between gap-2 p-2 md:p-4 w-full min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNavigateBack}
          className="flex-shrink-0 h-10 w-10"
          aria-label={t('songHeader.back')}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {song.songImageUrl ? (
            <img src={song.songImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <MusicalNoteIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold truncate" dir={/[\u0590-\u05FF]/.test(song.title) ? 'rtl' : 'ltr'}>{song.title}</h1>
            {song.author && (
              <p className="text-xs text-muted-foreground truncate" dir={/[\u0590-\u05FF]/.test(song.author) ? 'rtl' : 'ltr'}>{song.author}</p>
            )}
          </div>
        </div>
        {onPrevSong && onNextSong && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={onPrevSong} disabled={!canPrevSong} className="h-10 w-10" aria-label={t('common.back')}>
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            {nextSongInfo && canNextSong && (
              <div className="hidden sm:flex flex-col items-center min-w-0 max-w-[80px]">
                <span className="text-xs text-muted-foreground truncate w-full text-center">{t('songHeader.next')}:</span>
                <span className="text-xs font-semibold truncate w-full text-center" dir={/[\u0590-\u05FF]/.test(nextSongInfo.title) ? 'rtl' : 'ltr'}>{nextSongInfo.title}</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={onNextSong} disabled={!canNextSong} className="h-10 w-10" aria-label={t('songHeader.nextSong')}>
              <ArrowRightIcon className="h-5 w-5" />
            </Button>
          </div>
        )}
        {isInLibrary && (
          <div className="flex-shrink-0 p-2 text-green-600 dark:text-green-400" title="Dans la bibliothèque">
            <CheckIcon className="h-5 w-5" />
          </div>
        )}
        {showAddToLibrary && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0 h-10 w-10" aria-label="Menu">
                <EllipsisVerticalIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onAddToLibrary}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter à la bibliothèque
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Row 2: Auto-scroll + Toggle tools bar only */}
      <div className="flex items-center gap-2 px-2 pb-2 md:px-4 md:pb-4">
        <div className="flex items-center gap-0.5 border rounded-md px-1 py-0.5 flex-shrink-0">
          <Button variant={autoScroll.isActive ? 'default' : 'ghost'} size="icon" className="h-9 w-9" onClick={onToggleAutoScroll} title={autoScroll.isActive ? 'Arrêter' : 'Démarrer'}>
            {autoScroll.isActive ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSetAutoScrollSpeed(Math.max(0.5, autoScroll.speed - 0.2))}>
            <MinusIcon className="h-3 w-3" />
          </Button>
          <span className="text-xs font-medium min-w-[2rem] text-center">{autoScroll.speed.toFixed(1)}x</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSetAutoScrollSpeed(Math.min(4, autoScroll.speed + 0.2))}>
            <PlusIcon className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onResetScroll} title="Haut">
            <span className="text-sm font-bold">↑</span>
          </Button>
        </div>
        <Button variant="outline" size="sm" className="flex-shrink-0 h-9 gap-1" onClick={() => onToggleToolsBar?.()}>
          <MusicalNoteIcon className="h-4 w-4" />
          Outils
        </Button>
      </div>
    </div>
  );
}
