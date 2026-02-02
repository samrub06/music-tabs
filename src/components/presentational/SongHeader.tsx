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
  ChevronDownIcon,
  MusicalNoteIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { NOTES, generateAllKeys } from '@/utils/chords';
import { songHasOnlyEasyChords } from '@/utils/chordDifficulty';
import BpmSelectorPopover from './BpmSelectorPopover';

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
    onToggleEasyChordMode
}: SongHeaderProps) {
  const { t } = useLanguage();
  const [showControls, setShowControls] = useState(false);
  const [showBpmPopover, setShowBpmPopover] = useState(false);

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
    <div className="flex-shrink-0 border-b border-gray-200">
      {/* Mobile Header - Compact */}
      <div className="block md:hidden w-full max-w-full overflow-hidden">
        {/* Main Header - Always visible */}
        <div className="flex items-center justify-between p-2 gap-2 w-full max-w-full">
          <button
            onClick={onNavigateBack}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 active:bg-gray-200 flex-shrink-0 cursor-pointer select-none"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            aria-label={t('songHeader.back')}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          
          {/* Song Image */}
          <div className="flex-shrink-0">
            {song.songImageUrl ? (
              <img 
                src={song.songImageUrl} 
                alt={song.title}
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <MusicalNoteIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Title and Artist */}
          <div className="flex-1 min-w-0 px-1">
            <h1 className="text-sm font-bold text-gray-900 truncate" dir={/[\u0590-\u05FF]/.test(song.title) ? 'rtl' : 'ltr'}>
              {song.title}
            </h1>
            {song.author && (
              <p className="text-xs text-gray-600 truncate" dir={/[\u0590-\u05FF]/.test(song.author) ? 'rtl' : 'ltr'}>
                {song.author}
              </p>
            )}
          </div>
          
          {onPrevSong && onNextSong && (
            <div className="flex items-center space-x-2">
              <button
                onClick={onPrevSong}
                disabled={!canPrevSong}
                className="p-3 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 cursor-pointer select-none flex-shrink-0"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                title={t('common.back')}
                aria-label={t('songHeader.back')}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              {nextSongInfo && canNextSong && (
                <div className="flex flex-col items-center min-w-0 max-w-[80px]">
                  <span className="text-xs text-gray-500 truncate w-full text-center">{t('songHeader.next')}:</span>
                  <span className="text-xs font-semibold text-gray-700 truncate w-full text-center" dir={/[\u0590-\u05FF]/.test(nextSongInfo.title) ? 'rtl' : 'ltr'}>
                    {nextSongInfo.title}
                  </span>
                  {nextSongInfo.author && (
                    <span className="text-xs text-gray-500 truncate w-full text-center" dir={/[\u0590-\u05FF]/.test(nextSongInfo.author) ? 'rtl' : 'ltr'}>
                      {nextSongInfo.author}
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={onNextSong}
                disabled={!canNextSong}
                className="p-3 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 cursor-pointer select-none flex-shrink-0"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                title={t('songHeader.next')}
                aria-label={t('songHeader.nextSong')}
              >
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
          {/* Capo Toggle - Compact in header */}
          {song.capo !== undefined && song.capo !== null && (
            <button
              onClick={() => onToggleCapo(!useCapo)}
              className={`p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 flex-shrink-0 cursor-pointer select-none transition-colors ${
                useCapo
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-400 hover:text-gray-600 bg-gray-50'
              }`}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              aria-label={useCapo ? `${t('songHeader.capo')} ${song.capo}` : t('songHeader.noCapo')}
              title={useCapo ? `${t('songHeader.capo')} ${song.capo}` : t('songHeader.noCapo')}
            >
              <span className="text-[10px] leading-none font-semibold">🎸{useCapo ? song.capo : ''}</span>
            </button>
          )}
          <button
            onClick={onToggleEdit}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 active:bg-gray-200 flex-shrink-0 cursor-pointer select-none"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            aria-label="Éditer"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Sticky Auto-scroll Controls */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-2">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 w-full">
            <span className="text-xs font-medium text-gray-700">Auto-scroll:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={onToggleAutoScroll}
                className={`p-2 rounded-full shadow-sm hover:shadow-md transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center ${
                  autoScroll.isActive
                    ? 'bg-green-100 text-green-600 border-2 border-green-300'
                    : 'bg-white text-gray-400 hover:text-gray-600 border-2 border-gray-200'
                }`}
              >
                {autoScroll.isActive ? (
                  <PauseIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
              </button>
              
              <button
                onClick={() => onSetAutoScrollSpeed(Math.max(0.5, autoScroll.speed - 0.2))}
                className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <MinusIcon className="h-3 w-3" />
              </button>
              
              <div className="bg-white rounded-lg px-2 py-1 min-w-[40px] text-center shadow-sm">
                <span className="text-xs font-bold text-gray-900">
                  {autoScroll.speed.toFixed(1)}x
                </span>
              </div>
              
              <button
                onClick={() => onSetAutoScrollSpeed(Math.min(4, autoScroll.speed + 0.2))}
                className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <PlusIcon className="h-3 w-3" />
              </button>
              
              <button
                onClick={onResetScroll}
                className="p-2 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <span className="text-sm font-bold">↑</span>
              </button>
            </div>
          </div>
        </div>

        {/* Additional Controls Toggle */}
        <div className="px-3 py-2">
          <button
            onClick={() => setShowControls(!showControls)}
            className="flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 transition-colors duration-200"
          >
            <MusicalNoteIcon className="h-4 w-4 mr-2 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Contrôles avancés</span>
            <ChevronDownIcon className={`h-4 w-4 ml-2 text-gray-600 transition-transform duration-200 ${showControls ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Collapsible Additional Controls */}
        {showControls && (
          <div className="px-3 pb-3 space-y-3">
            {/* Instrument Toggle */}
            <div className="flex rounded-md shadow-sm w-full">
              <button
                onClick={() => onSetSelectedInstrument('piano')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-l-md border ${
                  selectedInstrument === 'piano'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🎹 Piano
              </button>
              <button
                onClick={() => onSetSelectedInstrument('guitar')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-r-md border-t border-r border-b ${
                  selectedInstrument === 'guitar'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🎸 Guitare
              </button>
            </div>

            {/* Metronome Controls */}
            {(song.bpm || onSetManualBpm) && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 w-full relative">
                <span className="text-xs font-medium text-gray-700">Métronome:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (song.bpm || manualBpm) {
                        onToggleMetronome();
                      } else {
                        setShowBpmPopover(!showBpmPopover);
                      }
                    }}
                    className={`p-2 rounded-full shadow-sm hover:shadow-md transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center ${
                      metronome.isActive
                        ? 'bg-blue-100 text-blue-600 border-2 border-blue-300'
                        : 'bg-white text-gray-400 hover:text-gray-600 border-2 border-gray-200'
                    }`}
                    title={(song.bpm || manualBpm) ? `Métronome ${manualBpm || song.bpm} BPM` : 'Définir BPM'}
                  >
                    {metronome.isActive ? (
                      <PauseIcon className="h-4 w-4" />
                    ) : (
                      <PlayIcon className="h-4 w-4" />
                    )}
                  </button>
                  {showBpmPopover && onSetManualBpm ? (
                    <BpmSelectorPopover
                      initialBpm={manualBpm || song.bpm || 100}
                      onApply={(bpm) => {
                        onSetManualBpm(bpm);
                        setShowBpmPopover(false);
                      }}
                      onClose={() => setShowBpmPopover(false)}
                    />
                  ) : (song.bpm || manualBpm) ? (
                    <div 
                      className="bg-white rounded-lg px-2 py-1 min-w-[50px] text-center shadow-sm cursor-pointer hover:bg-gray-50"
                      onClick={() => setShowBpmPopover(true)}
                    >
                      <span className="text-xs font-bold text-gray-900">
                        {manualBpm || song.bpm} BPM
                      </span>
                    </div>
                  ) : (
                    <div 
                      className="bg-white rounded-lg px-2 py-1 text-center shadow-sm cursor-pointer hover:bg-gray-50"
                      onClick={() => setShowBpmPopover(true)}
                    >
                      <span className="text-xs text-gray-500">
                        Définir
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Easy Chord Mode Toggle - Only show if not all chords are already easy */}
            {!hasOnlyEasyChords && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 w-full">
                <span className="text-xs font-medium text-green-700">Mode Accords Faciles:</span>
                <button
                  onClick={onToggleEasyChordMode}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                    easyChordMode
                      ? 'bg-green-600 text-white border-2 border-green-700'
                      : 'bg-white text-green-700 border-2 border-green-300 hover:bg-green-50'
                  }`}
                >
                  {easyChordMode ? 'Activé' : 'Désactivé'}
                </button>
              </div>
            )}


            {/* Transpose Controls */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 w-full">
              <span className="text-xs font-medium text-gray-700">Ton:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onSetTransposeValue(Math.max(transposeValue - 1, -11))}
                  disabled={transposeValue <= -11}
                  className="p-3 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200 min-w-[48px] min-h-[48px] flex items-center justify-center"
                >
                  <MinusIcon className="h-5 w-5" />
                </button>
                <div className="bg-white rounded-lg px-3 py-1 min-w-[50px] text-center shadow-sm">
                  <span className="text-sm font-bold text-gray-900">
                    {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
                  </span>
                </div>
                <button
                  onClick={() => onSetTransposeValue(Math.min(transposeValue + 1, 11))}
                  disabled={transposeValue >= 11}
                  className="p-3 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200 min-w-[48px] min-h-[48px] flex items-center justify-center"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Key Selector */}
            {(song.firstChord || song.key) && (
              <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 w-full">
                <span className="text-xs font-medium text-purple-700">{t('songHeader.key')}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-purple-600">
                    {getBaseChord()} → {currentKey || getBaseChord()}
                  </span>
                  <select
                    value={currentKey || getBaseChord()}
                    onChange={(e) => handleKeySelect(e.target.value)}
                    className="bg-white border border-purple-300 text-purple-800 text-sm font-medium rounded-lg px-3 py-2 shadow-sm hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[40px]"
                  >
                    {getAvailableKeys().map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Font Size Controls */}
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 w-full">
              <span className="text-xs font-medium text-blue-700">Taille:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onDecreaseFontSize}
                  disabled={fontSize <= 10}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-sm hover:shadow-md transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <MinusIcon className="h-3 w-3" />
                </button>
                <div className="bg-white rounded-lg px-3 py-1 min-w-[50px] text-center shadow-sm">
                  <span className="text-sm font-bold text-blue-800">
                    {fontSize}px
                  </span>
                </div>
                <button
                  onClick={onIncreaseFontSize}
                  disabled={fontSize >= 24}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-sm hover:shadow-md transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <PlusIcon className="h-3 w-3" />
                </button>
                <button
                  onClick={onResetFontSize}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full shadow-sm hover:shadow-md transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <EyeIcon className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onNavigateBack}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900" dir={/[\u0590-\u05FF]/.test(song.title) ? 'rtl' : 'ltr'}>
              {song.title}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              {song.author && (
                <p className="text-sm text-gray-600" dir={/[\u0590-\u05FF]/.test(song.author) ? 'rtl' : 'ltr'}>
                  {t('songHeader.by')} {song.author}
                </p>
              )}
              {song.capo !== undefined && song.capo !== null && (
                <>
                  {song.author && <span className="text-gray-300">•</span>}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-600 font-medium">🎸</span>
                    <div className="flex rounded-md shadow-sm">
                      <button
                        onClick={() => onToggleCapo(true)}
                        className={`px-2 py-1 text-xs font-medium rounded-l-md border ${
                          useCapo
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {t('songHeader.capo')} {song.capo}
                      </button>
                      <button
                        onClick={() => onToggleCapo(false)}
                        className={`px-2 py-1 text-xs font-medium rounded-r-md border-t border-r border-b ${
                          !useCapo
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {t('songHeader.noCapo')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onPrevSong && onNextSong && (
            <div className="flex items-center space-x-2 mr-2">
              <button
                onClick={onPrevSong}
                disabled={!canPrevSong}
                className="p-3 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 disabled:opacity-50 flex-shrink-0"
                title={t('common.back')}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              {nextSongInfo && canNextSong && (
                <div className="flex flex-col items-center min-w-0 max-w-[100px]">
                  <span className="text-xs text-gray-500 truncate w-full text-center">{t('songHeader.next')}:</span>
                  <span className="text-sm font-semibold text-gray-700 truncate w-full text-center" dir={/[\u0590-\u05FF]/.test(nextSongInfo.title) ? 'rtl' : 'ltr'}>
                    {nextSongInfo.title}
                  </span>
                  {nextSongInfo.author && (
                    <span className="text-xs text-gray-500 truncate w-full text-center" dir={/[\u0590-\u05FF]/.test(nextSongInfo.author) ? 'rtl' : 'ltr'}>
                      {nextSongInfo.author}
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={onNextSong}
                disabled={!canNextSong}
                className="p-3 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 disabled:opacity-50 flex-shrink-0"
                title={t('songHeader.next')}
              >
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
          {/* Instrument Toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => onSetSelectedInstrument('piano')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                selectedInstrument === 'piano'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              🎹 Piano
            </button>
            <button
              onClick={() => onSetSelectedInstrument('guitar')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                selectedInstrument === 'guitar'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              🎸 Guitare
            </button>
          </div>

          {/* Easy Chord Mode Toggle - Only show if not all chords are already easy */}
          {!hasOnlyEasyChords && (
            <button
              onClick={onToggleEasyChordMode}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                easyChordMode
                  ? 'bg-green-600 text-white border-2 border-green-700'
                  : 'bg-white text-green-700 border-2 border-green-300 hover:bg-green-50'
              }`}
              title="Mode Accords Faciles"
            >
              {easyChordMode ? '✓ Accords Faciles' : 'Accords Faciles'}
            </button>
          )}


          {/* Transpose Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onSetTransposeValue(Math.max(transposeValue - 1, -11))}
                disabled={transposeValue <= -11}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <MinusIcon className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium min-w-[3rem] text-center">
                {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
              </span>
              <button
                onClick={() => onSetTransposeValue(Math.min(transposeValue + 1, 11))}
                disabled={transposeValue >= 11}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            
            {/* Key Selector for Desktop */}
            {(song.firstChord || song.key) && (
              <div className="flex items-center space-x-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1">
                <span className="text-xs text-purple-600 font-medium">
                  {getBaseChord()} → {currentKey || getBaseChord()}
                </span>
                <select
                  value={currentKey || getBaseChord()}
                  onChange={(e) => handleKeySelect(e.target.value)}
                  className="bg-white border border-purple-300 text-purple-800 text-xs font-medium rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {getAvailableKeys().map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Auto-scroll Controls */}
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
            <button
              onClick={onToggleAutoScroll}
              className={`p-2 rounded-full ${
                autoScroll.isActive
                  ? 'bg-green-100 text-green-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-white'
              }`}
              title={autoScroll.isActive ? 'Arrêter le défilement' : 'Démarrer le défilement'}
            >
              {autoScroll.isActive ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </button>
            
            <button
              onClick={() => onSetAutoScrollSpeed(Math.max(0.5, autoScroll.speed - 0.2))}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white rounded"
              title="Ralentir"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            
            <span className="text-xs text-gray-600 min-w-[2rem] text-center">
              {autoScroll.speed.toFixed(1)}x
            </span>
            
            <button
              onClick={() => onSetAutoScrollSpeed(Math.min(4, autoScroll.speed + 0.2))}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white rounded"
              title="Accélérer"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
            
            <button
              onClick={onResetScroll}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded bg-white"
              title="Remonter en haut"
            >
              ↑ Haut
            </button>
          </div>

          {/* Metronome Controls */}
          {(song.bpm || onSetManualBpm) && (
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2 relative">
              <button
                onClick={() => {
                  if (song.bpm || manualBpm) {
                    onToggleMetronome();
                  } else {
                    setShowBpmPopover(!showBpmPopover);
                  }
                }}
                className={`p-2 rounded-full ${
                  metronome.isActive
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-white'
                }`}
                title={(song.bpm || manualBpm) ? `Métronome ${manualBpm || song.bpm} BPM` : 'Définir BPM'}
              >
                {metronome.isActive ? (
                  <PauseIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
              </button>
              {showBpmPopover && onSetManualBpm ? (
                <BpmSelectorPopover
                  initialBpm={manualBpm || song.bpm || 100}
                  onApply={(bpm) => {
                    onSetManualBpm(bpm);
                    setShowBpmPopover(false);
                  }}
                  onClose={() => setShowBpmPopover(false)}
                />
              ) : (song.bpm || manualBpm) ? (
                <span 
                  className="text-xs text-gray-600 min-w-[3rem] text-center cursor-pointer hover:text-gray-900"
                  onClick={() => setShowBpmPopover(true)}
                >
                  {manualBpm || song.bpm} BPM
                </span>
              ) : (
                <span 
                  className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => setShowBpmPopover(true)}
                >
                  Définir
                </span>
              )}
            </div>
          )}

          {/* Font Size Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <button
              onClick={onDecreaseFontSize}
              disabled={fontSize <= 10}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Réduire la taille"
            >
              <MinusIcon className="h-3 sm:h-4 w-3 sm:w-4" />
            </button>
            <span className="hidden sm:block text-xs font-medium min-w-[2rem] text-center text-gray-600">
              {fontSize}px
            </span>
            <button
              onClick={onIncreaseFontSize}
              disabled={fontSize >= 24}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Augmenter la taille"
            >
              <PlusIcon className="h-3 sm:h-4 w-3 sm:w-4" />
            </button>
            <button
              onClick={onResetFontSize}
              className="p-1 text-gray-400 hover:text-gray-600 ml-1"
              title="Taille par défaut"
            >
              <EyeIcon className="h-3 sm:h-4 w-3 sm:w-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={onToggleEdit}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            title="Éditer"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
            title="Supprimer"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
