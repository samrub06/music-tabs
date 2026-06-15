'use client';

import { Song } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useSongCover } from '@/lib/hooks/useSongCover';
import {
  MinusIcon,
  PlusIcon,
  PauseIcon,
  PlayIcon,
  MusicalNoteIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  BackArrowIcon,
  ForwardArrowIcon,
} from '@/components/icons/DirectionalIcons';
import { cn } from '@/lib/utils';
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
  isInLibrary?: boolean;
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
  isInLibrary = false,
}: SongHeaderProps) {
  const { t, isRtl } = useLanguage();
  const coverUrl = useSongCover(song);

  return (
    <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-background relative">
      {/* Single row: back, cover, auto-scroll, tools, prev/next, saved or add */}
      <div
        className="flex items-center justify-between gap-2 p-2 sm:p-3 md:p-4 w-full min-w-0"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onNavigateBack}
          className="flex-shrink-0 h-10 w-10"
          aria-label={t('songHeader.back')}
        >
          <BackArrowIcon className="h-5 w-5" />
        </Button>

        <div
          className={cn(
            'flex min-w-0 flex-1 items-center',
            isInLibrary && 'hidden sm:flex'
          )}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
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
            {t('songHeader.CAPO_WITH_VALUE').replace('{capo}', String(song.capo))}
          </span>
        )}

        {/* Auto-scroll: label + play + speed; icon/text order swaps in RTL */}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <div
            className="flex items-center gap-1 rounded-md border px-1 py-0.5"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <Button
              variant={autoScroll.isActive ? 'default' : 'ghost'}
              size="icon"
              className="order-2 h-9 w-9"
              onClick={onToggleAutoScroll}
              title={
                autoScroll.isActive
                  ? t('songHeader.STOP_AUTO_SCROLL')
                  : t('songHeader.START_AUTO_SCROLL')
              }
            >
              {autoScroll.isActive ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className={cn('h-4 w-4', isRtl && '-scale-x-100')} />
              )}
            </Button>
            <span
              className="order-1 hidden whitespace-nowrap px-0.5 text-xs text-muted-foreground md:inline"
            >
              {t('songHeader.AUTO_SCROLL_LABEL')}
            </span>
            <span className="order-3 min-w-[2rem] text-center text-xs font-medium">
              {autoScroll.speed.toFixed(1)}x
            </span>
            {autoScroll.isActive && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="order-4 h-7 w-7"
                  onClick={() => onSetAutoScrollSpeed(Math.max(0.5, autoScroll.speed - 0.2))}
                >
                  <MinusIcon className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="order-5 h-7 w-7"
                  onClick={() => onSetAutoScrollSpeed(Math.min(4, autoScroll.speed + 0.2))}
                >
                  <PlusIcon className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tools: icon only below md, icon + "Outils" from md */}
        {onToggleToolsBar && (
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 flex-shrink-0 md:h-9 md:w-auto md:min-w-0 md:gap-1.5 md:px-3"
            onClick={() => onToggleToolsBar()}
            aria-label={t('songHeader.TOOLS_LABEL')}
            title={t('songHeader.TOOLS_LABEL')}
          >
            <Cog6ToothIcon className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden text-sm md:inline">{t('songHeader.TOOLS_LABEL')}</span>
          </Button>
        )}

        {onPrevSong && onNextSong && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={onPrevSong} disabled={!canPrevSong} className="h-10 w-10" aria-label={t('common.back')}>
              <BackArrowIcon className="h-5 w-5" />
            </Button>
            {nextSongInfo && canNextSong && (
              <div className="hidden md:flex min-w-0 max-w-[7rem] flex-col items-end rtl:items-start">
                <span
                  className="truncate text-xs font-medium text-foreground"
                  dir={/[\u0590-\u05FF]/.test(nextSongInfo.title) ? 'rtl' : 'ltr'}
                >
                  {nextSongInfo.title}
                </span>
              </div>
            )}
            <Button
              variant="default"
              onClick={onNextSong}
              disabled={!canNextSong}
              className={cn(
                'h-10 min-w-[5.25rem] shrink-0 gap-1.5 px-4 shadow-sm',
                isRtl && 'flex-row-reverse'
              )}
              aria-label={t('songHeader.nextSong')}
            >
              <span className="text-sm font-medium">{t('songHeader.next')}</span>
              <ForwardArrowIcon className="h-5 w-5 shrink-0" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
