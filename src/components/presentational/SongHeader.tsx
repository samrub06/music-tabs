'use client';

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
  autoScroll,
  onNavigateBack,
  onToggleAutoScroll,
  onSetAutoScrollSpeed,
  onPrevSong,
  onNextSong,
  canPrevSong,
  canNextSong,
  onToggleToolsBar,
}: SongHeaderProps) {
  const { t, isRtl } = useLanguage();
  const playing = autoScroll.isActive;

  return (
    <div className="flex-shrink-0 border-b border-border bg-background relative">
      <div
        className="flex items-center justify-between gap-2 p-2.5 sm:p-2 w-full min-w-0 min-h-14 sm:min-h-0"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onNavigateBack}
          className={cn(
            'flex-shrink-0 h-11 w-11 sm:h-10 sm:w-10 transition-all duration-300 ease-out motion-reduce:transition-none',
            playing && 'pointer-events-none max-w-0 scale-75 opacity-0 overflow-hidden p-0 border-0'
          )}
          aria-label={t('songHeader.back')}
          tabIndex={playing ? -1 : undefined}
        >
          <BackArrowIcon className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
          <div
            className={cn(
              'flex min-w-0 items-center overflow-hidden rounded-xl border border-border/80 bg-muted/30 transition-all duration-300 ease-out motion-reduce:transition-none',
              playing ? 'max-w-[16rem] flex-none' : 'max-w-full flex-1'
            )}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {playing ? (
              <div className="flex min-w-0 flex-1 items-center justify-center gap-0.5 px-1.5 py-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 sm:h-8 sm:w-8 shrink-0"
                  onClick={() => onSetAutoScrollSpeed(Math.max(0.5, autoScroll.speed - 0.2))}
                  aria-label={t('songHeader.AUTO_SCROLL_LABEL')}
                >
                  <MinusIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="default"
                  className="h-11 min-w-[4.5rem] shrink-0 px-5"
                  onClick={onToggleAutoScroll}
                  title={t('songHeader.STOP_AUTO_SCROLL')}
                >
                  <PauseIcon className="h-5 w-5" />
                </Button>
                <span className="min-w-[2.25rem] shrink-0 text-center text-xs font-semibold tabular-nums">
                  {autoScroll.speed.toFixed(1)}x
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 sm:h-8 sm:w-8 shrink-0"
                  onClick={() => onSetAutoScrollSpeed(Math.min(4, autoScroll.speed + 0.2))}
                  aria-label={t('songHeader.AUTO_SCROLL_LABEL')}
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onToggleAutoScroll}
                className={cn(
                  'flex h-11 sm:h-10 min-w-0 flex-1 items-center justify-center gap-2 px-3 text-sm font-medium text-foreground transition-colors',
                  'hover:bg-muted/50 active:bg-muted/70'
                )}
                title={t('songHeader.START_AUTO_SCROLL')}
              >
                <PlayIcon className={cn('h-4 w-4 shrink-0', isRtl && '-scale-x-100')} />
                <span className="truncate">{t('songHeader.AUTO_SCROLL_LABEL')}</span>
              </button>
            )}

            {onToggleToolsBar && (
              <>
                <div
                  className={cn(
                    'h-8 w-px shrink-0 bg-border/80 transition-all duration-300 motion-reduce:transition-none',
                    playing && 'w-0 opacity-0'
                  )}
                  aria-hidden
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-11 w-11 sm:h-10 sm:w-10 shrink-0 rounded-none rounded-e-xl rtl:rounded-e-none rtl:rounded-s-xl transition-all duration-300 ease-out motion-reduce:transition-none',
                    playing && 'pointer-events-none max-w-0 scale-75 opacity-0 overflow-hidden p-0'
                  )}
                  onClick={() => onToggleToolsBar()}
                  aria-label={t('songHeader.TOOLS_LABEL')}
                  title={t('songHeader.TOOLS_LABEL')}
                  tabIndex={playing ? -1 : undefined}
                  aria-hidden={playing}
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div
          className={cn(
            'flex items-center gap-1 flex-shrink-0 transition-all duration-300 ease-out motion-reduce:transition-none',
            playing && 'pointer-events-none max-w-0 scale-75 opacity-0 overflow-hidden'
          )}
          aria-hidden={playing}
        >
          {onPrevSong && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevSong}
              disabled={!canPrevSong}
              className="hidden sm:inline-flex h-10 w-10"
              aria-label={t('common.previous')}
              tabIndex={playing ? -1 : undefined}
            >
              <BackArrowIcon className="h-5 w-5" />
            </Button>
          )}

          {onNextSong && (
            <Button
              variant="default"
              onClick={onNextSong}
              disabled={!canNextSong}
              className={cn(
                'h-11 sm:h-10 min-w-[5.25rem] shrink-0 gap-1.5 px-4 shadow-sm',
                isRtl && 'flex-row-reverse'
              )}
              aria-label={t('songHeader.nextSong')}
              tabIndex={playing ? -1 : undefined}
            >
              <span className="text-sm font-medium">{t('songHeader.next')}</span>
              <ForwardArrowIcon className="h-5 w-5 shrink-0" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
