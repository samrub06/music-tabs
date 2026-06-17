'use client';

import { Song } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import {
  MinusIcon,
  PlusIcon,
  PauseIcon,
  PlayIcon,
  AdjustmentsHorizontalIcon,
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
  onToggleToolsBar,
}: SongHeaderProps) {
  const { t, isRtl } = useLanguage();

  return (
    <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-background relative">
      {/* Single row: back, cover, auto-scroll, tools, prev/next, saved or add */}
      <div
        className="flex items-center justify-between gap-2 p-2 w-full min-w-0"
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

        {/* Capo: show in header on all breakpoints (including mobile), same height as other buttons (h-10) */}
        {song.capo !== undefined && song.capo !== null && (
          <span className="flex-shrink-0 flex items-center h-10 text-xs font-medium text-muted-foreground bg-muted/60 dark:bg-muted/40 px-2.5 rounded-md" title={t('songHeader.capo')}>
            {t('songHeader.CAPO_WITH_VALUE').replace('{capo}', String(song.capo))}
          </span>
        )}

        {/* Auto-scroll + song tools — grouped, minimal gap */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
          <div
            className="flex min-w-0 flex-1 items-center overflow-hidden rounded-xl border border-border/80 bg-muted/30"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="flex min-w-0 flex-1 items-center gap-0.5 px-1.5 py-0.5">
              <Button
                variant={autoScroll.isActive ? 'default' : 'ghost'}
                size="icon"
                className="order-2 h-9 w-9 shrink-0"
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
              <span className="order-1 hidden min-w-0 truncate whitespace-nowrap px-0.5 text-xs text-muted-foreground">
                {t('songHeader.AUTO_SCROLL_LABEL')}
              </span>
              <span className="order-3 min-w-[2.25rem] shrink-0 text-center text-xs font-semibold tabular-nums">
                {autoScroll.speed.toFixed(1)}x
              </span>
              {autoScroll.isActive && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="order-4 h-8 w-8 shrink-0"
                    onClick={() => onSetAutoScrollSpeed(Math.max(0.5, autoScroll.speed - 0.2))}
                  >
                    <MinusIcon className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="order-5 h-8 w-8 shrink-0"
                    onClick={() => onSetAutoScrollSpeed(Math.min(4, autoScroll.speed + 0.2))}
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>

            {onToggleToolsBar && (
              <>
                <div className="h-8 w-px shrink-0 bg-border/80" aria-hidden />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-none rounded-e-xl rtl:rounded-e-none rtl:rounded-s-xl"
                  onClick={() => onToggleToolsBar()}
                  aria-label={t('songHeader.TOOLS_LABEL')}
                  title={t('songHeader.TOOLS_LABEL')}
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {onPrevSong && onNextSong && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={onPrevSong} disabled={!canPrevSong} className="h-10 w-10" aria-label={t('common.back')}>
              <BackArrowIcon className="h-5 w-5" />
            </Button>
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
