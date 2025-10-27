'use client';

import { Song } from '@/types';
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

interface SongHeaderProps {
  song: Song;
  selectedInstrument: 'piano' | 'guitar';
  transposeValue: number;
  autoScroll: {
    isActive: boolean;
    speed: number;
  };
  fontSize: number;
  onNavigateBack: () => void;
  onToggleEdit: () => void;
  onDelete: () => void;
  onSetSelectedInstrument: (instrument: 'piano' | 'guitar') => void;
  onSetTransposeValue: (value: number) => void;
  onToggleAutoScroll: () => void;
  onSetAutoScrollSpeed: (speed: number) => void;
  onResetScroll: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onResetFontSize: () => void;
  onPrevSong?: () => void;
  onNextSong?: () => void;
  canPrevSong?: boolean;
  canNextSong?: boolean;
}

export default function SongHeader({
  song,
  selectedInstrument,
  transposeValue,
  autoScroll,
  fontSize,
  onNavigateBack,
  onToggleEdit,
  onDelete,
  onSetSelectedInstrument,
  onSetTransposeValue,
  onToggleAutoScroll,
  onSetAutoScrollSpeed,
  onResetScroll,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onResetFontSize,
  onPrevSong,
  onNextSong,
  canPrevSong,
  canNextSong
}: SongHeaderProps) {
  const [showControls, setShowControls] = useState(false);
  return (
    <div className="flex-shrink-0 border-b border-gray-200">
      {/* Mobile Header - Compact */}
      <div className="block md:hidden w-full max-w-full overflow-hidden">
        {/* Main Header - Always visible */}
        <div className="flex items-center justify-between p-2 gap-2 w-full max-w-full">
          <button
            onClick={onNavigateBack}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 flex-shrink-0"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1 text-center px-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 truncate max-w-full" dir={/[\u0590-\u05FF]/.test(song.title) ? 'rtl' : 'ltr'}>
              {song.title}
            </h1>
            {song.author && (
              <p className="text-xs text-gray-600 truncate" dir={/[\u0590-\u05FF]/.test(song.author) ? 'rtl' : 'ltr'}>
                Par {song.author}
              </p>
            )}
          </div>
          {onPrevSong && onNextSong && (
            <div className="flex items-center space-x-1">
              <button
                onClick={onPrevSong}
                disabled={!canPrevSong}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 disabled:opacity-50"
                title="Précédente"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={onNextSong}
                disabled={!canNextSong}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 disabled:opacity-50"
                title="Suivante"
              >
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
          <button
            onClick={onToggleEdit}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 flex-shrink-0"
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

            {/* Transpose Controls */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 w-full">
              <span className="text-xs font-medium text-gray-700">Ton:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onSetTransposeValue(Math.max(transposeValue - 1, -11))}
                  disabled={transposeValue <= -11}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <div className="bg-white rounded-lg px-3 py-1 min-w-[50px] text-center shadow-sm">
                  <span className="text-sm font-bold text-gray-900">
                    {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
                  </span>
                </div>
                <button
                  onClick={() => onSetTransposeValue(Math.min(transposeValue + 1, 11))}
                  disabled={transposeValue >= 11}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

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
                  Par {song.author}
                </p>
              )}
              {song.capo && (
                <>
                  {song.author && <span className="text-gray-300">•</span>}
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-blue-600 font-medium">🎸</span>
                    <span className="text-sm text-blue-600 font-medium">Capo {song.capo}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onPrevSong && onNextSong && (
            <div className="flex items-center space-x-1 mr-2">
              <button
                onClick={onPrevSong}
                disabled={!canPrevSong}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 disabled:opacity-50"
                title="Chanson précédente"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={onNextSong}
                disabled={!canNextSong}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 disabled:opacity-50"
                title="Chanson suivante"
              >
                <ArrowRightIcon className="h-4 w-4" />
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

          {/* Transpose Controls */}
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
