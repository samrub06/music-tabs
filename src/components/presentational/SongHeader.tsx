'use client';

import { Song } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import {
  ArrowLeftIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  MusicalNoteIcon,
  ArrowRightIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import { Button } from '@/components/ui/button';

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
  onToggleToolsBar,
}: SongHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-background relative">
      {/* Single row: back, cover, auto-scroll, tools, prev/next, saved or add */}
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

        <div className="flex min-w-0 flex-1 items-center">
          {song.songImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={song.songImageUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted"
              aria-hidden
            >
              <MusicalNoteIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
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
      </div>
    </div>
  );
}
