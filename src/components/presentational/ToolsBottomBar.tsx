'use client';

import { Song } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import {
  MinusIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  LinkIcon,
  CheckIcon,
  MusicalNoteIcon,
  UserPlusIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { generateAllKeys } from '@/utils/chords';
import { songHasOnlyEasyChords } from '@/utils/chordDifficulty';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Piano, Guitar } from 'lucide-react';
import { shareOrCopyLink } from '@/utils/shareLink';
import ShareWithFriendDialog from '@/components/social/ShareWithFriendDialog';
import { useAuthContext } from '@/context/AuthContext';
import { absoluteSongShareUrl, songPath } from '@/lib/seo/songPath';
import { cn } from '@/lib/utils';
import {
  type ChordSectionPref,
  readChordSectionPref,
  writeChordSectionPref,
} from '@/utils/chordSectionPrefs';

function interpolate(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (str, [key, value]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    template
  );
}

const BAR_MIN_HEIGHT = 48;
const BAR_MAX_HEIGHT_PERCENT = 92;

type ToolId =
  | 'font'
  | 'instrument'
  | 'key'
  | 'easy'
  | 'capo'
  | 'chordPref'
  | 'share'
  | 'friend';

/** Default open height — enough for icon row + one expanded panel. */
export function getDefaultToolsBarHeight(): number {
  if (typeof window === 'undefined') return 320;
  const viewportHeight = window.innerHeight;
  const maxH = viewportHeight * (BAR_MAX_HEIGHT_PERCENT / 100);
  return Math.round(Math.min(maxH, Math.max(280, viewportHeight * 0.42)));
}

interface ToolsBottomBarProps {
  song: Song;
  selectedInstrument: 'piano' | 'guitar';
  transposeValue: number;
  fontSize: number;
  useCapo: boolean;
  easyChordMode: boolean;
  height: number;
  onHeightChange: (height: number) => void;
  onClose: () => void;
  onSetSelectedInstrument: (instrument: 'piano' | 'guitar') => void;
  onSetTransposeValue: (value: number) => void;
  onToggleCapo: (value: boolean) => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onResetFontSize: () => void;
  onToggleEasyChordMode: () => void;
  onToggleEdit?: () => void;
  onDelete?: () => void;
}

function ToolIconButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        'flex min-w-[3.25rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 transition-all duration-200',
        active
          ? 'bg-primary/15 text-primary ring-1 ring-primary/25'
          : 'bg-white/25 text-muted-foreground backdrop-blur-md hover:bg-white/40 hover:text-foreground dark:bg-white/[0.08] dark:hover:bg-white/[0.14]'
      )}
    >
      {children}
      <span className="max-w-full truncate text-[10px] font-medium leading-tight">
        {label}
      </span>
    </button>
  );
}

export default function ToolsBottomBar({
  song,
  selectedInstrument,
  transposeValue,
  fontSize,
  useCapo,
  easyChordMode,
  height,
  onHeightChange,
  onClose,
  onSetSelectedInstrument,
  onSetTransposeValue,
  onToggleCapo,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onResetFontSize,
  onToggleEasyChordMode,
  onToggleEdit,
  onDelete,
}: ToolsBottomBarProps) {
  const { t } = useLanguage();
  const { user } = useAuthContext();
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareWithFriendOpen, setShareWithFriendOpen] = useState(false);
  const [expandedTool, setExpandedTool] = useState<ToolId | null>('font');
  const [chordSectionPref, setChordSectionPref] = useState<ChordSectionPref>('auto');
  const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setChordSectionPref(readChordSectionPref());
  }, []);

  const handleChordSectionPref = (pref: ChordSectionPref) => {
    setChordSectionPref(pref);
    writeChordSectionPref(pref);
  };

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current) clearTimeout(copyFeedbackTimerRef.current);
    };
  }, []);

  const handleShareLink = useCallback(async () => {
    const url = absoluteSongShareUrl(song);

    const title = `${song.title} — ${song.author}`;
    const text = interpolate(t('songHeader.shareSongText'), {
      title: song.title,
      author: song.author,
    });

    try {
      const result = await shareOrCopyLink({ url, title, text });
      if (result === 'copied') {
        setLinkCopied(true);
        if (copyFeedbackTimerRef.current) clearTimeout(copyFeedbackTimerRef.current);
        copyFeedbackTimerRef.current = setTimeout(() => setLinkCopied(false), 2500);
      }
    } catch (error) {
      console.error('Failed to share song link:', error);
    }
  }, [song, t]);

  const getBaseChord = () => song.firstChord || song.key || 'C';
  const getAvailableKeys = () => generateAllKeys(getBaseChord());
  const getCurrentKey = () => {
    const availableKeys = getAvailableKeys();
    const baseIndex = 0;
    const currentIndex = (baseIndex + transposeValue + 12) % 12;
    return availableKeys[currentIndex];
  };

  const handleKeySelect = (targetKey: string) => {
    const availableKeys = getAvailableKeys();
    const targetIndex = availableKeys.findIndex((key) => key === targetKey);
    if (targetIndex === -1) return;
    const baseIndex = 0;
    let newTransposeValue = targetIndex - baseIndex;
    if (newTransposeValue > 6) newTransposeValue -= 12;
    else if (newTransposeValue < -6) newTransposeValue += 12;
    onSetTransposeValue(newTransposeValue);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = height;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const maxH =
        typeof window !== 'undefined'
          ? window.innerHeight * (BAR_MAX_HEIGHT_PERCENT / 100)
          : 400;
      const next = Math.round(Math.min(maxH, Math.max(BAR_MIN_HEIGHT, startH + deltaY)));
      onHeightChange(next);
    };
    const onPointerUp = () => {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const hasOnlyEasyChords = songHasOnlyEasyChords(song.allChords);
  const hasCapo = song.capo !== undefined && song.capo !== null;
  const hasKey = Boolean(song.firstChord || song.key);
  const currentKey = getCurrentKey();
  const availableKeys = getAvailableKeys();

  const toggleTool = (id: ToolId) => {
    setExpandedTool((prev) => (prev === id ? null : id));
  };

  const panelClass =
    'rounded-2xl border border-border bg-card/80 p-3.5 backdrop-blur-md dark:bg-card/50';
  const labelClass = 'text-[11px] font-medium text-muted-foreground mb-2.5';
  const segmentClass = 'flex rounded-full bg-muted/80 p-0.5 gap-0.5';
  const segmentOptionClass = (active: boolean) =>
    `flex-1 rounded-full py-2 text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div
      className="flex flex-shrink-0 flex-col overflow-hidden rounded-t-[1.75rem] border border-b-0 border-border bg-background backdrop-blur-xl shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.5)]"
      style={{ height: `${height}px` }}
    >
      <div
        role="separator"
        aria-label={t('songHeader.resize')}
        onPointerDown={onPointerDown}
        className="relative flex min-h-11 shrink-0 cursor-ns-resize touch-none items-center justify-center py-3"
      >
        <div className="h-1 w-14 rounded-full bg-muted-foreground/25" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={t('songHeader.close')}
        >
          <XMarkIcon className="h-6 w-6" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto overscroll-contain px-4 pb-3">
        {/* All functions visible as icons; tap one to expand its controls */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <ToolIconButton
            active={expandedTool === 'font'}
            label={t('songHeader.fontSize')}
            onClick={() => toggleTool('font')}
          >
            <span className="text-sm font-bold leading-none">Aa</span>
          </ToolIconButton>

          <ToolIconButton
            active={expandedTool === 'instrument'}
            label={t('songHeader.instrument')}
            onClick={() => toggleTool('instrument')}
          >
            {selectedInstrument === 'guitar' ? (
              <Guitar className="h-5 w-5" />
            ) : (
              <Piano className="h-5 w-5" />
            )}
          </ToolIconButton>

          {hasKey ? (
            <ToolIconButton
              active={expandedTool === 'key'}
              label={t('songHeader.keyTranspose')}
              onClick={() => toggleTool('key')}
            >
              <span className="text-sm font-bold tabular-nums leading-none">
                {currentKey || getBaseChord()}
              </span>
            </ToolIconButton>
          ) : null}

          {!hasOnlyEasyChords ? (
            <ToolIconButton
              active={expandedTool === 'easy'}
              label={t('songHeader.easyChords')}
              onClick={() => toggleTool('easy')}
            >
              <MusicalNoteIcon className={cn('h-5 w-5', easyChordMode && 'text-primary')} />
            </ToolIconButton>
          ) : null}

          {hasCapo ? (
            <ToolIconButton
              active={expandedTool === 'capo'}
              label={t('songHeader.capo')}
              onClick={() => toggleTool('capo')}
            >
              <span className="text-xs font-bold leading-none">C{song.capo}</span>
            </ToolIconButton>
          ) : null}

          <ToolIconButton
            active={expandedTool === 'chordPref'}
            label={t('songContent.chordSectionPref')}
            onClick={() => toggleTool('chordPref')}
          >
            <Squares2X2Icon className="h-5 w-5" />
          </ToolIconButton>

          <ToolIconButton
            active={expandedTool === 'share'}
            label={t('songHeader.shareLink')}
            onClick={() => toggleTool('share')}
          >
            {linkCopied ? (
              <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <LinkIcon className="h-5 w-5" />
            )}
          </ToolIconButton>

          {user ? (
            <ToolIconButton
              active={expandedTool === 'friend'}
              label={t('friends.shareAction')}
              onClick={() => toggleTool('friend')}
            >
              <UserPlusIcon className="h-5 w-5" />
            </ToolIconButton>
          ) : null}
        </div>

        {expandedTool === 'font' ? (
          <div className={panelClass}>
            <p className={labelClass}>{t('songHeader.fontSize')}</p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={onDecreaseFontSize}
                disabled={fontSize <= 10}
                className="h-10 w-10 shrink-0 rounded-xl"
              >
                <MinusIcon className="h-4 w-4" />
              </Button>
              <span className="min-w-[2.5rem] text-center text-sm font-medium tabular-nums">
                {fontSize}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={onIncreaseFontSize}
                disabled={fontSize >= 24}
                className="h-10 w-10 shrink-0 rounded-xl"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onResetFontSize}
                className="h-10 w-10 shrink-0 rounded-xl"
              >
                <EyeIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {expandedTool === 'instrument' ? (
          <div className={panelClass}>
            <p className={labelClass}>{t('songHeader.instrument')}</p>
            <div className={segmentClass}>
              <button
                type="button"
                onClick={() => onSetSelectedInstrument('piano')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium transition-all duration-200 ${
                  selectedInstrument === 'piano'
                    ? 'bg-blue-500/15 text-blue-700 shadow-sm dark:text-blue-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Piano className="h-4 w-4 shrink-0" /> {t('songHeader.piano')}
              </button>
              <button
                type="button"
                onClick={() => onSetSelectedInstrument('guitar')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium transition-all duration-200 ${
                  selectedInstrument === 'guitar'
                    ? 'bg-amber-500/15 text-amber-700 shadow-sm dark:text-amber-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Guitar className="h-4 w-4 shrink-0" /> {t('songHeader.guitar')}
              </button>
            </div>
          </div>
        ) : null}

        {expandedTool === 'key' && hasKey ? (
          <div className={panelClass}>
            <p className={labelClass}>{t('songHeader.keyTranspose')}</p>
            <div className="flex items-center gap-2">
              <Select value={currentKey || getBaseChord()} onValueChange={handleKeySelect}>
                <SelectTrigger className="h-10 flex-1 rounded-xl border border-amber-200/80 bg-background/50 focus:ring-amber-500/20 dark:border-amber-700/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex shrink-0 items-center overflow-hidden rounded-xl border border-border/80 bg-muted/40">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-none"
                  onClick={() => onSetTransposeValue(Math.max(-11, transposeValue - 1))}
                  disabled={transposeValue <= -11}
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <span className="min-w-[2.25rem] text-center text-sm font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                  {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-none"
                  onClick={() => onSetTransposeValue(Math.min(11, transposeValue + 1))}
                  disabled={transposeValue >= 11}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {expandedTool === 'easy' && !hasOnlyEasyChords ? (
          <div className={panelClass}>
            <p className={labelClass}>{t('songHeader.easyChords')}</p>
            <button
              type="button"
              onClick={onToggleEasyChordMode}
              className={`min-h-[2.75rem] w-full rounded-xl py-2.5 text-sm font-medium transition-all ${
                easyChordMode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {t('songHeader.easyChords')}
            </button>
          </div>
        ) : null}

        {expandedTool === 'capo' && hasCapo ? (
          <div className={panelClass}>
            <p className={labelClass}>{t('songHeader.capo')}</p>
            <div className={segmentClass}>
              <button
                type="button"
                onClick={() => onToggleCapo(true)}
                className={segmentOptionClass(useCapo)}
              >
                Capo {song.capo}
              </button>
              <button
                type="button"
                onClick={() => onToggleCapo(false)}
                className={segmentOptionClass(!useCapo)}
              >
                {t('songHeader.noCapo')}
              </button>
            </div>
          </div>
        ) : null}

        {expandedTool === 'chordPref' ? (
          <div className={panelClass}>
            <p className={labelClass}>{t('songContent.chordSectionPref')}</p>
            <div className={segmentClass}>
              {(
                [
                  ['auto', 'chordSectionPrefAuto'],
                  ['always_open', 'chordSectionPrefOpen'],
                  ['always_collapsed', 'chordSectionPrefCollapsed'],
                ] as const
              ).map(([value, labelKey]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChordSectionPref(value)}
                  className={segmentOptionClass(chordSectionPref === value)}
                >
                  {t(`songContent.${labelKey}`)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {expandedTool === 'share' ? (
          <div className={panelClass}>
            <p className={labelClass}>{t('songHeader.shareLink')}</p>
            <Button
              type="button"
              variant="outline"
              onClick={handleShareLink}
              className={`h-10 w-full rounded-xl font-medium transition-colors ${
                linkCopied
                  ? 'border-green-600/40 bg-green-500/10 text-green-700 hover:bg-green-500/15 dark:border-green-400/40 dark:text-green-400'
                  : ''
              }`}
              aria-live="polite"
            >
              {linkCopied ? (
                <>
                  <CheckIcon className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                  {t('songHeader.linkCopied')}
                </>
              ) : (
                <>
                  <LinkIcon className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                  {t('songHeader.shareLink')}
                </>
              )}
            </Button>
          </div>
        ) : null}

        {expandedTool === 'friend' && user ? (
          <div className={panelClass}>
            <p className={labelClass}>{t('friends.shareWithFriend')}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShareWithFriendOpen(true)}
              className="h-10 w-full rounded-xl font-medium"
            >
              <UserPlusIcon className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
              {t('friends.shareAction')}
            </Button>
          </div>
        ) : null}
      </div>

      {(onToggleEdit || onDelete) && (
        <div className="flex shrink-0 gap-2.5 border-t border-border/60 bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          {onToggleEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleEdit}
              className="h-11 min-h-[44px] flex-1 rounded-xl font-medium"
            >
              <PencilIcon className="mr-1.5 h-4 w-4" /> {t('songHeader.edit')}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="h-11 min-h-[44px] rounded-xl px-4 font-medium"
            >
              <TrashIcon className="mr-1.5 h-4 w-4" /> {t('songHeader.delete')}
            </Button>
          )}
        </div>
      )}

      {user && (
        <ShareWithFriendDialog
          open={shareWithFriendOpen}
          onOpenChange={setShareWithFriendOpen}
          entityType="song"
          entityId={song.id}
          entityTitle={song.title}
          sharePath={songPath(song)}
        />
      )}
    </div>
  );
}
