'use client';

import { Song } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import {
  ArrowLeftIcon,
  EyeIcon,
  MinusIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
  MusicalNoteIcon,
  ArrowRightIcon,
  CheckIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { generateAllKeys } from '@/utils/chords';
import { songHasOnlyEasyChords } from '@/utils/chordDifficulty';
import BpmSelectorPopover from './BpmSelectorPopover';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SongHeaderProps {
  song: Song;
  selectedInstrument: 'piano' | 'guitar';
  transposeValue: number;
  autoScroll: {
    isActive: boolean;
    speed: number;
  };
  fontSize: number;
  useCapo: boolean;
  onToggleCapo: (value: boolean) => void;
  onNavigateBack: () => void;
  onToggleEdit: () => void;
  onDelete: () => void;
  onSetSelectedInstrument: (instrument: 'piano' | 'guitar') => void;
  onSetTransposeValue: (value: number) => void;
  onToggleAutoScroll: () => void;
  onSetAutoScrollSpeed: (speed: number) => void;
  metronome: {
    isActive: boolean;
    bpm: number | null;
  };
  onToggleMetronome: () => void;
  onResetScroll: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onResetFontSize: () => void;
  onPrevSong?: () => void;
  onNextSong?: () => void;
  canPrevSong?: boolean;
  canNextSong?: boolean;
  nextSongInfo?: { title: string; author?: string } | null;
  manualBpm?: number | null;
  onSetManualBpm?: (bpm: number) => void;
  easyChordMode: boolean;
  onToggleEasyChordMode: () => void;
  isInLibrary?: boolean;
  onAddToLibrary?: () => void;
}

export default function SongHeader({
  song,
  selectedInstrument,
  transposeValue,
  autoScroll,
  fontSize,
  useCapo,
  onToggleCapo,
  onNavigateBack,
  onToggleEdit,
  onDelete,
  onSetSelectedInstrument,
  onSetTransposeValue,
  onToggleAutoScroll,
  onSetAutoScrollSpeed,
  metronome,
  onToggleMetronome,
  onResetScroll,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onResetFontSize,
  onPrevSong,
  onNextSong,
  canPrevSong,
  canNextSong,
    nextSongInfo,
    manualBpm,
    onSetManualBpm,
    easyChordMode,
    onToggleEasyChordMode,
    isInLibrary,
    onAddToLibrary
}: SongHeaderProps) {
  const { t } = useLanguage();
  const [showBpmPopover, setShowBpmPopover] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Get the base chord (firstChord or fallback to key or default)
  const getBaseChord = () => {
    // console.log('SongHeader render', { bpm: song.bpm, manualBpm, hasHandler: !!onSetManualBpm });
    return song.firstChord || song.key || 'C';
  };

  // Generate all available keys based on the base chord quality
  const getAvailableKeys = () => {
    const baseChord = getBaseChord();
    return generateAllKeys(baseChord);
  };

  // Calculate current key based on firstChord (or key) and transpose value
  const getCurrentKey = () => {
    const baseChord = getBaseChord();
    const availableKeys = getAvailableKeys();
    
    // The base chord is always at index 0 since generateAllKeys starts from the base chord
    const baseIndex = 0;
    
    // Calculate the new index after transposition
    const currentIndex = (baseIndex + transposeValue + 12) % 12;
    return availableKeys[currentIndex];
  };

  // Handle key selection from dropdown
  const handleKeySelect = (targetKey: string) => {
    const availableKeys = getAvailableKeys();
    
    // Find the index of the target key in the available keys
    const targetIndex = availableKeys.findIndex(key => key === targetKey);
    
    if (targetIndex === -1) return;
    
    // The base chord is always at index 0
    const baseIndex = 0;
    
    // Calculate the transpose value needed to reach the target key
    let newTransposeValue = targetIndex - baseIndex;
    
    // Normalize to range -11 to +11 (prefer smaller absolute values)
    if (newTransposeValue > 6) {
      newTransposeValue -= 12;
    } else if (newTransposeValue < -6) {
      newTransposeValue += 12;
    }
    
    onSetTransposeValue(newTransposeValue);
  };

  const currentKey = getCurrentKey();

  // Check if all chords are already easy - if so, hide the Easy Chord Mode button
  const hasOnlyEasyChords = songHasOnlyEasyChords(song.allChords);

  return (
    <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-background relative">
      {/* Line 1: Back, cover+title+artist, prev/next, Plus menu */}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0 h-10 w-10" aria-label="Menu">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isInLibrary && onAddToLibrary && (
              <DropdownMenuItem onClick={onAddToLibrary}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter à la bibliothèque
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onToggleEdit}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Éditer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <TrashIcon className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Une seule ligne : Transpose, Auto-scroll, Outils (bottom sheet) */}
      <div className="flex items-center gap-2 px-2 pb-2 md:px-4 md:pb-4">
        {/* Transpose */}
        <div className="flex items-center gap-0.5 border rounded-md flex-shrink-0 overflow-hidden">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onSetTransposeValue(Math.max(transposeValue - 1, -11))} disabled={transposeValue <= -11}>
            <MinusIcon className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium min-w-[2.25rem] text-center">{transposeValue > 0 ? `+${transposeValue}` : transposeValue}</span>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onSetTransposeValue(Math.min(transposeValue + 1, 11))} disabled={transposeValue >= 11}>
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
        {/* Auto-scroll */}
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
        {/* Outils : bottom sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="flex-shrink-0 h-9 gap-1">
              <MusicalNoteIcon className="h-4 w-4" />
              Outils
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Outils</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              {(song.firstChord || song.key) && (
                <>
                  <div>
                    <p className="text-sm font-medium mb-2">{t('songHeader.key')}</p>
                    <Select value={currentKey || getBaseChord()} onValueChange={handleKeySelect}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableKeys().map((key) => (
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
              {(song.bpm || onSetManualBpm) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Métronome</p>
                    <div className="flex items-center gap-2">
                      <Button variant={metronome.isActive ? 'default' : 'outline'} size="sm" onClick={onToggleMetronome}>
                        {metronome.isActive ? 'Pause' : 'Play'} {manualBpm || song.bpm} BPM
                      </Button>
                      {onSetManualBpm && (
                        <Button variant="outline" size="sm" onClick={() => { setSheetOpen(false); setShowBpmPopover(true); }}>
                          Définir BPM
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { onToggleEdit(); setSheetOpen(false); }} className="flex-1">
                  <PencilIcon className="h-4 w-4 mr-1" /> Éditer
                </Button>
                <Button variant="destructive" size="sm" onClick={() => { onDelete(); setSheetOpen(false); }}>
                  <TrashIcon className="h-4 w-4 mr-1" /> Supprimer
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* BPM popover (ouvert depuis Outils) */}
      {showBpmPopover && onSetManualBpm && (
        <div className="absolute right-2 md:right-4 top-full mt-1 z-50 p-3 rounded-lg border bg-background shadow-lg">
          <BpmSelectorPopover
            initialBpm={manualBpm || song.bpm || 100}
            onApply={(bpm) => { onSetManualBpm(bpm); setShowBpmPopover(false); }}
            onClose={() => setShowBpmPopover(false)}
          />
        </div>
      )}
    </div>
  );
}
