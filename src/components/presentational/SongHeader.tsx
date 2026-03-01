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
  Cog6ToothIcon,
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

  return (
    <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-background relative">
      {/* Single row: back, cover+title, auto-scroll, tools, prev/next, saved or add */}
      <div className="flex items-center justify-between gap-2 p-2 sm:p-3 md:p-4 w-full min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNavigateBack}
          className="flex-shrink-0 h-10 w-10"
          aria-label={t('songHeader.back')}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>

        {/* Cover + title: from sm = inline; below sm = cover only, title/subtitle in dropdown on click */}
        <div className="flex items-center gap-2 min-w-0 flex-1 sm:max-w-[50%]">
          {/* Below sm: cover only, click opens dropdown with title + subtitle + library */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="sm:hidden flex items-center outline-none rounded-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 flex-shrink-0">
                {song.songImageUrl ? (
                  <img src={song.songImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <MusicalNoteIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px] p-3 sm:hidden">
              <p className="font-semibold text-sm break-words" dir={/[\u0590-\u05FF]/.test(song.title) ? 'rtl' : 'ltr'}>{song.title}</p>
              {song.author && (
                <p className="text-xs text-muted-foreground mt-0.5 break-words" dir={/[\u0590-\u05FF]/.test(song.author) ? 'rtl' : 'ltr'}>{song.author}</p>
              )}
              <div className="mt-2 pt-2 border-t border-border">
                {isInLibrary ? (
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <CheckIcon className="h-4 w-4 flex-shrink-0" />
                    <span>Dans la bibliothèque</span>
                  </div>
                ) : onAddToLibrary ? (
                  <DropdownMenuItem onClick={onAddToLibrary} className="cursor-pointer">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Ajouter à la bibliothèque
                  </DropdownMenuItem>
                ) : null}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* From sm: cover + title + subtitle always visible */}
          <div className="hidden sm:flex items-center gap-2 min-w-0 flex-1">
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
        </div>

        {/* Capo: show in header on all breakpoints (including mobile), same height as other buttons (h-10) */}
        {song.capo !== undefined && song.capo !== null && (
          <span className="flex-shrink-0 flex items-center h-10 text-xs font-medium text-muted-foreground bg-muted/60 dark:bg-muted/40 px-2.5 rounded-md" title={t('songHeader.capo')}>
            Capo {song.capo}
          </span>
        )}

        {/* Auto-scroll: from md show label "Auto scroll" + play + speed, +/- when playing */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="hidden md:inline text-xs text-muted-foreground whitespace-nowrap">Auto scroll</span>
          <div className="flex items-center gap-0.5 border rounded-md px-1 py-0.5">
            <Button variant={autoScroll.isActive ? 'default' : 'ghost'} size="icon" className="h-9 w-9" onClick={onToggleAutoScroll} title={autoScroll.isActive ? 'Arrêter' : 'Démarrer'}>
              {autoScroll.isActive ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
            </Button>
            <span className="text-xs font-medium min-w-[2rem] text-center">{autoScroll.speed.toFixed(1)}x</span>
            {autoScroll.isActive && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSetAutoScrollSpeed(Math.max(0.5, autoScroll.speed - 0.2))}>
                  <MinusIcon className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSetAutoScrollSpeed(Math.min(4, autoScroll.speed + 0.2))}>
                  <PlusIcon className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tools: icon only below md, icon + "Outils" from md */}
        {onToggleToolsBar && (
          <Button variant="outline" size="icon" className="flex-shrink-0 h-10 w-10 md:h-9 md:gap-1.5 md:px-3 md:w-auto md:min-w-0" onClick={() => onToggleToolsBar()} aria-label="Outils" title="Outils">
            <Cog6ToothIcon className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden md:inline text-sm">Outils</span>
          </Button>
        )}

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
        {/* From sm: saved or add to library icon in header */}
        {isInLibrary && (
          <div className="hidden sm:flex flex-shrink-0 p-2 text-green-600 dark:text-green-400" title="Dans la bibliothèque">
            <CheckIcon className="h-5 w-5" />
          </div>
        )}
        {!isInLibrary && onAddToLibrary && (
          <Button variant="ghost" size="icon" className="hidden sm:flex flex-shrink-0 h-10 w-10" onClick={onAddToLibrary} aria-label="Ajouter à la bibliothèque" title="Ajouter à la bibliothèque">
            <PlusIcon className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
