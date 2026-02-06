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
import { Separator } from '@/components/ui/separator';

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

  return (
    <div
      className="flex flex-col border-t border-gray-200 dark:border-gray-700 bg-background flex-shrink-0 overflow-hidden"
      style={{ height: `${height}px` }}
    >
      <div
        role="separator"
        aria-label="Redimensionner"
        onPointerDown={onPointerDown}
        className="relative flex items-center justify-center py-1.5 cursor-ns-resize touch-none border-b border-gray-200 dark:border-gray-700 hover:bg-muted/50"
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Fermer"
        >
          <XMarkIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4">
        {(song.firstChord || song.key) && (
          <>
            <div>
              <p className="text-sm font-medium mb-2">{t('songHeader.key')}</p>
              <Select value={currentKey || getBaseChord()} onValueChange={handleKeySelect}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableKeys.map((key) => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
          </>
        )}
        {song.capo !== undefined && song.capo !== null && (
          <>
            <div>
              <p className="text-sm font-medium mb-2">Capo</p>
              <div className="flex gap-2">
                <Button variant={useCapo ? 'default' : 'outline'} size="sm" onClick={() => onToggleCapo(true)} className="flex-1">
                  Capo {song.capo}
                </Button>
                <Button variant={!useCapo ? 'default' : 'outline'} size="sm" onClick={() => onToggleCapo(false)} className="flex-1">
                  {t('songHeader.noCapo')}
                </Button>
              </div>
            </div>
            <Separator />
          </>
        )}
        <div>
          <p className="text-sm font-medium mb-2">Instrument</p>
          <div className="flex gap-2">
            <Button variant={selectedInstrument === 'piano' ? 'default' : 'outline'} size="sm" onClick={() => onSetSelectedInstrument('piano')} className="flex-1">
              Piano
            </Button>
            <Button variant={selectedInstrument === 'guitar' ? 'default' : 'outline'} size="sm" onClick={() => onSetSelectedInstrument('guitar')} className="flex-1">
              Guitare
            </Button>
          </div>
        </div>
        {!hasOnlyEasyChords && (
          <>
            <Separator />
            <div>
              <Button variant={easyChordMode ? 'default' : 'outline'} size="sm" onClick={onToggleEasyChordMode} className="w-full">
                {easyChordMode ? 'Accords faciles activé' : 'Accords faciles'}
              </Button>
            </div>
          </>
        )}
        <Separator />
        <div>
          <p className="text-sm font-medium mb-2">Taille du texte</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onDecreaseFontSize} disabled={fontSize <= 10}>
              <MinusIcon className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[3rem] text-center">{fontSize}px</span>
            <Button variant="outline" size="icon" onClick={onIncreaseFontSize} disabled={fontSize >= 24}>
              <PlusIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onResetFontSize}>
              <EyeIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Separator />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onToggleEdit} className="flex-1">
            <PencilIcon className="h-4 w-4 mr-1" /> Éditer
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <TrashIcon className="h-4 w-4 mr-1" /> Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
}
