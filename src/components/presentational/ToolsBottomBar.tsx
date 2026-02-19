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
} from '@heroicons/react/24/outline';
import React from 'react';
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

const BAR_MIN_HEIGHT = 48;
const BAR_MAX_HEIGHT_PERCENT = 60;

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
  onToggleEdit: () => void;
  onDelete: () => void;
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
      const maxH = typeof window !== 'undefined' ? window.innerHeight * (BAR_MAX_HEIGHT_PERCENT / 100) : 400;
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
  const currentKey = getCurrentKey();
  const availableKeys = getAvailableKeys();

  const cardClass = 'rounded-2xl bg-white/70 dark:bg-white/[0.06] backdrop-blur-md border border-black/[0.06] dark:border-white/[0.08] p-3.5';
  const labelClass = 'text-[11px] font-medium text-muted-foreground mb-2.5';
  const segmentClass = 'flex rounded-full bg-muted/80 p-0.5 gap-0.5';
  const segmentOptionClass = (active: boolean) =>
    `flex-1 rounded-full py-2 text-sm font-medium transition-all duration-200 ${active ? 'bg-background dark:bg-white/10 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`;

  return (
    <div
      className="flex flex-col flex-shrink-0 overflow-hidden rounded-t-[1.75rem] border border-b-0 border-black/[0.06] dark:border-white/[0.08] bg-background/95 dark:bg-background/98 backdrop-blur-xl shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)]"
      style={{ height: `${height}px` }}
    >
      <div
        role="separator"
        aria-label="Redimensionner"
        onPointerDown={onPointerDown}
        className="relative flex items-center justify-center py-3.5 cursor-ns-resize touch-none"
      >
        <div className="w-14 h-1 rounded-full bg-muted-foreground/25" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Fermer"
        >
          <XMarkIcon className="h-7 w-7" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-5 space-y-3.5">
        {(song.firstChord || song.key) && (
          <div className={cardClass}>
            <p className={labelClass}>{t('songHeader.key')} · Transpose</p>
            <div className="flex gap-2 items-center">
              <Select value={currentKey || getBaseChord()} onValueChange={handleKeySelect}>
                <SelectTrigger className="flex-1 h-10 rounded-xl border border-amber-200/80 dark:border-amber-700/50 bg-background/50 focus:ring-amber-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableKeys.map((key) => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center rounded-xl border border-border/80 bg-muted/40 overflow-hidden shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={() => onSetTransposeValue(Math.max(-11, transposeValue - 1))} disabled={transposeValue <= -11}>
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold tabular-nums min-w-[2.25rem] text-center text-amber-700 dark:text-amber-400">{transposeValue > 0 ? `+${transposeValue}` : transposeValue}</span>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={() => onSetTransposeValue(Math.min(11, transposeValue + 1))} disabled={transposeValue >= 11}>
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
        {song.capo !== undefined && song.capo !== null && (
          <div className={cardClass}>
            <p className={labelClass}>Capo</p>
            <div className={segmentClass}>
              <button type="button" onClick={() => onToggleCapo(true)} className={segmentOptionClass(useCapo)}>Capo {song.capo}</button>
              <button type="button" onClick={() => onToggleCapo(false)} className={segmentOptionClass(!useCapo)}>{t('songHeader.noCapo')}</button>
            </div>
          </div>
        )}
        <div className={cardClass}>
          <p className={labelClass}>Instrument</p>
          <div className={segmentClass}>
            <button type="button" onClick={() => onSetSelectedInstrument('piano')} className={`flex-1 rounded-full py-2 flex items-center justify-center gap-1.5 text-sm font-medium transition-all duration-200 ${selectedInstrument === 'piano' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Piano className="h-4 w-4 shrink-0" /> Piano
            </button>
            <button type="button" onClick={() => onSetSelectedInstrument('guitar')} className={`flex-1 rounded-full py-2 flex items-center justify-center gap-1.5 text-sm font-medium transition-all duration-200 ${selectedInstrument === 'guitar' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Guitar className="h-4 w-4 shrink-0" /> Guitare
            </button>
          </div>
        </div>
        {!hasOnlyEasyChords && (
          <div className={cardClass}>
            <button type="button" onClick={onToggleEasyChordMode} className={`w-full rounded-xl py-2.5 text-sm font-medium transition-all ${easyChordMode ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              {easyChordMode ? 'Accords faciles · activé' : 'Accords faciles'}
            </button>
          </div>
        )}
        <div className={cardClass}>
          <p className={`${labelClass} text-center`}>Taille du texte</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" onClick={onDecreaseFontSize} disabled={fontSize <= 10} className="h-9 w-9 rounded-xl shrink-0">
              <MinusIcon className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium tabular-nums min-w-[2.5rem] text-center">{fontSize}</span>
            <Button variant="outline" size="icon" onClick={onIncreaseFontSize} disabled={fontSize >= 24} className="h-9 w-9 rounded-xl shrink-0">
              <PlusIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onResetFontSize} className="h-9 w-9 rounded-xl shrink-0">
              <EyeIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2.5 pt-0.5">
          <Button variant="outline" size="sm" onClick={onToggleEdit} className="flex-1 h-10 rounded-xl font-medium">
            <PencilIcon className="h-4 w-4 mr-1.5" /> Éditer
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete} className="h-10 rounded-xl font-medium px-4">
            <TrashIcon className="h-4 w-4 mr-1.5" /> Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
}
