'use client';

import { useLanguage } from '@/context/LanguageContext';
import {
  MinusIcon,
  PlusIcon,
  PauseIcon,
  PlayIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
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
  /** Lyric-line follow is active (audio/practice sync) — shown as ON in the header. */
  lyricFollowActive?: boolean;
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
  /** Browse list / artist songs dropdown next to Next. */
  songBrowserOpen?: boolean;
  onToggleSongBrowser?: () => void;
}

export default function SongHeader({
  autoScroll,
  lyricFollowActive = false,
  onToggleAutoScroll,
  onSetAutoScrollSpeed,
  onPrevSong,
  onNextSong,
  canPrevSong,
  canNextSong,
  onToggleToolsBar,
  songBrowserOpen = false,
  onToggleSongBrowser,
}: SongHeaderProps) {
  const { t, isRtl } = useLanguage();
  const playing = autoScroll.isActive;
  const followMode = lyricFollowActive && !playing;
  const centerActive = playing || followMode;
  const showNextGroup = Boolean(onNextSong || onToggleSongBrowser);

  return (
    <div className="relative flex-shrink-0 border-b border-border bg-background">
      <div
        className="flex min-h-14 w-full min-w-0 items-center justify-between gap-2 p-2.5 sm:min-h-0 sm:p-2"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
          <div
            className={cn(
              'flex min-w-0 items-center overflow-hidden rounded-xl border border-border/80 bg-muted/30 transition-all duration-300 ease-out motion-reduce:transition-none',
              centerActive ? 'max-w-[20rem] flex-none' : 'max-w-full flex-1',
              followMode && 'border-primary/40 bg-primary/10'
            )}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {playing ? (
              <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5 px-2.5 py-1.5 sm:gap-2 sm:py-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 sm:h-8 sm:w-8"
                  onClick={() => onSetAutoScrollSpeed(Math.max(0.5, autoScroll.speed - 0.2))}
                  aria-label={t('songHeader.AUTO_SCROLL_LABEL')}
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  className="h-9 min-w-[3.75rem] shrink-0 px-4 py-2 sm:h-8"
                  onClick={onToggleAutoScroll}
                  title={t('songHeader.STOP_AUTO_SCROLL')}
                >
                  <PauseIcon className="h-4 w-4" />
                </Button>
                <span className="min-w-[2.5rem] shrink-0 text-center text-xs font-semibold tabular-nums">
                  {autoScroll.speed.toFixed(1)}x
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 sm:h-8 sm:w-8"
                  onClick={() => onSetAutoScrollSpeed(Math.min(4, autoScroll.speed + 0.2))}
                  aria-label={t('songHeader.AUTO_SCROLL_LABEL')}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            ) : followMode ? (
              <div
                className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 px-3 text-sm font-medium text-primary sm:h-10"
                title={t('songHeader.FOLLOWING_LYRICS')}
                aria-live="polite"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="truncate">{t('songHeader.FOLLOWING_LYRICS')}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onToggleAutoScroll}
                className={cn(
                  'flex h-11 min-w-0 flex-1 items-center justify-center gap-2 px-3 text-sm font-medium text-foreground transition-colors sm:h-10',
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
                    centerActive && 'w-0 opacity-0'
                  )}
                  aria-hidden
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-11 w-11 shrink-0 rounded-none rounded-e-xl transition-all duration-300 ease-out motion-reduce:transition-none sm:h-10 sm:w-10 rtl:rounded-e-none rtl:rounded-s-xl',
                    centerActive && 'pointer-events-none max-w-0 scale-75 overflow-hidden p-0 opacity-0'
                  )}
                  onClick={() => onToggleToolsBar()}
                  aria-label={t('songHeader.TOOLS_LABEL')}
                  title={t('songHeader.TOOLS_LABEL')}
                  tabIndex={centerActive ? -1 : undefined}
                  aria-hidden={centerActive}
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div
          className={cn(
            'flex flex-shrink-0 items-center gap-1 transition-all duration-300 ease-out motion-reduce:transition-none',
            centerActive && 'pointer-events-none max-w-0 scale-75 overflow-hidden opacity-0'
          )}
          aria-hidden={centerActive}
        >
          {onPrevSong && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevSong}
              disabled={!canPrevSong}
              className="inline-flex h-11 w-11 sm:h-10 sm:w-10"
              aria-label={t('common.previous')}
              tabIndex={centerActive ? -1 : undefined}
            >
              <BackArrowIcon className="h-5 w-5" />
            </Button>
          )}

          {showNextGroup && (
            <div
              data-song-browser-trigger
              className={cn(
                'flex h-11 shrink-0 items-stretch overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-sm sm:h-10',
                songBrowserOpen && 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background'
              )}
            >
              {onNextSong ? (
                <button
                  type="button"
                  onClick={onNextSong}
                  disabled={!canNextSong}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 text-sm font-medium transition-colors',
                    'hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50',
                    isRtl && 'flex-row-reverse'
                  )}
                  aria-label={t('songHeader.nextSong')}
                  tabIndex={centerActive ? -1 : undefined}
                >
                  <span>{t('songHeader.next')}</span>
                  <ForwardArrowIcon className="h-5 w-5 shrink-0" />
                </button>
              ) : null}

              {onNextSong && onToggleSongBrowser ? (
                <span className="my-2 w-px shrink-0 bg-primary-foreground/30" aria-hidden />
              ) : null}

              {onToggleSongBrowser ? (
                <button
                  type="button"
                  onClick={onToggleSongBrowser}
                  aria-expanded={songBrowserOpen}
                  aria-label={t('songHeader.navBrowseSongs')}
                  title={t('songHeader.navBrowseSongs')}
                  tabIndex={centerActive ? -1 : undefined}
                  className={cn(
                    'inline-flex items-center justify-center px-2 transition-colors hover:bg-primary/90',
                    'min-w-[2.25rem]'
                  )}
                >
                  <ChevronDownIcon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-transform duration-200',
                      songBrowserOpen && 'rotate-180'
                    )}
                  />
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
