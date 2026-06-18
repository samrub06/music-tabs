'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  getOptimalLineHeight,
  getLyricOffsetPx,
  needsWrapping,
  wrapLyricsWithChords,
  type TextMeasurementOptions,
} from '@/utils/textMeasurement';
import {
  getSongChordFontFamily,
  getSongLyricsFontFamily,
  usesProportionalChordAlignment,
} from '@/utils/songFonts';
import { containsHebrew, getTextDirection } from '@/utils/rtl';
import type { ChordPosition, SongLine } from '@/types';
import { cn } from '@/lib/utils';

interface ChordWithOffset {
  chord: string;
  position: number;
  horizontalOffset: number;
  originalIndex: number;
}

function groupChordsByPosition(
  chords: ChordPosition[],
  fontSize: number,
  charWidth: number,
  chordFontFamily: string,
  spacing: number = 50
): ChordWithOffset[] {
  const positionGroups = new Map<number, Array<{ chord: string; originalIndex: number }>>();

  chords.forEach((chordPos, index) => {
    if (!positionGroups.has(chordPos.position)) {
      positionGroups.set(chordPos.position, []);
    }
    positionGroups.get(chordPos.position)!.push({
      chord: chordPos.chord,
      originalIndex: index,
    });
  });

  const getChordWidth = (chord: string): number => {
    if (typeof document === 'undefined') {
      return chord.length * charWidth * 1.1;
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      return chord.length * charWidth * 1.1;
    }
    context.font = `${fontSize}px ${chordFontFamily}`;
    return context.measureText(chord).width + 2;
  };

  const result: ChordWithOffset[] = [];

  positionGroups.forEach((chordGroup, position) => {
    if (chordGroup.length === 1) {
      result.push({
        chord: chordGroup[0].chord,
        position,
        horizontalOffset: 0,
        originalIndex: chordGroup[0].originalIndex,
      });
      return;
    }

    let cumulativeOffset = 0;
    chordGroup.forEach(({ chord, originalIndex }) => {
      result.push({
        chord,
        position,
        horizontalOffset: cumulativeOffset,
        originalIndex,
      });
      const chordWidth = getChordWidth(chord);
      const dynamicSpacing = Math.max(spacing, fontSize * 0.3);
      cumulativeOffset += chordWidth + dynamicSpacing;
    });
  });

  result.sort((a, b) => a.originalIndex - b.originalIndex);
  return result;
}

export interface ChordOverLyricsLineProps {
  line: Pick<SongLine, 'lyrics' | 'chords'>;
  fontSize: number;
  onChordClick?: (chord: string) => void;
  editMode?: boolean;
  onLyricCharacterClick?: (position: number) => void;
  onChordChipClick?: (chordIndex: number) => void;
}

function getCharacterIndexFromClick(
  text: string,
  clickX: number,
  fontSize: number,
  fontFamily: string,
  proportional: boolean,
  charWidth: number,
  isRtl: boolean
): number {
  if (typeof document === 'undefined') {
    return Math.min(Math.floor(clickX / charWidth), text.length);
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return Math.min(Math.floor(clickX / charWidth), text.length);
  }

  context.font = `${fontSize}px ${fontFamily}`;

  if (proportional) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let i = 0; i <= text.length; i++) {
      const width = context.measureText(text.slice(0, i)).width;
      const distance = Math.abs(width - clickX);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    return isRtl ? text.length - bestIndex : bestIndex;
  }

  return Math.min(Math.max(0, Math.round(clickX / charWidth)), text.length);
}

interface ChordButtonsProps {
  chords: ChordPosition[];
  lyrics: string;
  fontSize: number;
  isHebrew: boolean;
  lyricsFontFamily: string;
  chordFontFamily: string;
  proportional: boolean;
  charWidth: number;
  containerWidth: number;
  editMode?: boolean;
  onChordClick?: (chord: string) => void;
  onChordChipClick?: (chordIndex: number) => void;
}

function ChordButtons({
  chords,
  lyrics,
  fontSize,
  isHebrew,
  lyricsFontFamily,
  chordFontFamily,
  proportional,
  charWidth,
  containerWidth,
  editMode,
  onChordClick,
  onChordChipClick,
}: ChordButtonsProps) {
  const groupedChords = groupChordsByPosition(chords, fontSize, charWidth, chordFontFamily);

  return (
    <>
      {groupedChords.map((chordWithOffset, chordIndex) => {
        const safePosition = Math.min(chordWithOffset.position, lyrics.length);
        const baseLeftOffset = Math.min(
          getLyricOffsetPx(
            lyrics,
            safePosition,
            fontSize,
            lyricsFontFamily,
            proportional,
            charWidth
          ),
          containerWidth - 50
        );
        const leftOffset = baseLeftOffset + chordWithOffset.horizontalOffset;

        if (editMode) {
          return (
            <button
              key={chordIndex}
              type="button"
              onClick={() => onChordChipClick?.(chordWithOffset.originalIndex)}
              className="absolute z-10 rounded-md bg-blue-100 px-1.5 py-0.5 text-blue-800 ring-1 ring-blue-300 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:ring-blue-700"
              style={{
                left: isHebrew ? 'auto' : `${leftOffset}px`,
                right: isHebrew ? `${leftOffset}px` : 'auto',
                fontSize: `${fontSize}px`,
                lineHeight: 1.4,
              }}
            >
              {chordWithOffset.chord}
            </button>
          );
        }

        return (
          <button
            key={chordIndex}
            type="button"
            onClick={() => onChordClick?.(chordWithOffset.chord)}
            className="absolute z-10 cursor-pointer whitespace-nowrap text-blue-600 hover:text-blue-800 hover:underline"
            style={{
              left: isHebrew ? 'auto' : `${leftOffset}px`,
              right: isHebrew ? `${leftOffset}px` : 'auto',
              fontSize: `${fontSize}px`,
              lineHeight: 1.4,
              maxWidth: 'calc(100vw - 40px)',
            }}
          >
            {chordWithOffset.chord}
          </button>
        );
      })}
    </>
  );
}

interface WrappedChordLyricsLineProps {
  line: Pick<SongLine, 'lyrics' | 'chords'>;
  isHebrew: boolean;
  fontSize: number;
  measurementOptions: TextMeasurementOptions;
  editMode?: boolean;
  onChordClick?: (chord: string) => void;
  onLyricCharacterClick?: (position: number) => void;
  onChordChipClick?: (chordIndex: number) => void;
}

const WrappedChordLyricsLine = React.forwardRef<HTMLDivElement, WrappedChordLyricsLineProps>(
  (
    {
      line,
      isHebrew,
      fontSize,
      measurementOptions,
      editMode,
      onChordClick,
      onLyricCharacterClick,
      onChordChipClick,
    },
    ref
  ) => {
    const lyricsFontFamily = measurementOptions.fontFamily;
    const chordFontFamily = getSongChordFontFamily();
    const proportional = usesProportionalChordAlignment(isHebrew);
    const charWidth = fontSize * 0.58;
    const wrappedLines = wrapLyricsWithChords(
      line.lyrics ?? '',
      line.chords ?? [],
      measurementOptions
    );
    const lineHeight = getOptimalLineHeight(fontSize);

    return (
      <div
        ref={ref}
        className="mb-2 w-full"
        dir={getTextDirection(line.lyrics ?? '')}
        style={{ fontFamily: lyricsFontFamily, maxWidth: '100%', overflow: 'hidden' }}
      >
        {wrappedLines.map((wrappedLine, lineIndex) => (
          <div key={lineIndex} className="mb-1 w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <div
              className="relative min-h-[1.8rem] w-full font-semibold text-blue-600"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight,
                fontFamily: chordFontFamily,
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            >
              <ChordButtons
                chords={wrappedLine.chords}
                lyrics={wrappedLine.lyrics}
                fontSize={fontSize}
                isHebrew={isHebrew}
                lyricsFontFamily={lyricsFontFamily}
                chordFontFamily={chordFontFamily}
                proportional={proportional}
                charWidth={charWidth}
                containerWidth={measurementOptions.containerWidth}
                editMode={editMode}
                onChordClick={onChordClick}
                onChordChipClick={onChordChipClick}
              />
            </div>
            <div
              className={cn(
                'min-h-[1.8rem] w-full text-gray-900 dark:text-gray-100',
                editMode && 'cursor-text rounded-md hover:bg-muted/50'
              )}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight,
                fontFamily: lyricsFontFamily,
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                maxWidth: '100%',
              }}
              onClick={
                editMode && onLyricCharacterClick
                  ? (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = isHebrew
                        ? rect.right - e.clientX
                        : e.clientX - rect.left;
                      const position = getCharacterIndexFromClick(
                        wrappedLine.lyrics,
                        clickX,
                        fontSize,
                        lyricsFontFamily,
                        proportional,
                        charWidth,
                        isHebrew
                      );
                      onLyricCharacterClick(wrappedLine.startPos + position);
                    }
                  : undefined
              }
              role={editMode ? 'button' : undefined}
              tabIndex={editMode ? 0 : undefined}
            >
              {wrappedLine.lyrics}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

WrappedChordLyricsLine.displayName = 'WrappedChordLyricsLine';

export default function ChordOverLyricsLine({
  line,
  fontSize,
  onChordClick,
  editMode = false,
  onLyricCharacterClick,
  onChordChipClick,
}: ChordOverLyricsLineProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lyrics = line.lyrics ?? '';
  const chords = line.chords ?? [];
  const isHebrew = containsHebrew(lyrics);
  const lyricsFontFamily = getSongLyricsFontFamily(isHebrew);
  const chordFontFamily = getSongChordFontFamily();
  const proportional = usesProportionalChordAlignment(isHebrew);
  const charWidth = fontSize * 0.58;

  useEffect(() => {
    const measureWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, [fontSize]);

  const measurementOptions: TextMeasurementOptions = {
    fontSize,
    fontFamily: lyricsFontFamily,
    containerWidth: Math.max(containerWidth, 300),
    padding: 20,
  };

  const needsWrappingCheck = needsWrapping(lyrics, measurementOptions);

  if (needsWrappingCheck) {
    return (
      <WrappedChordLyricsLine
        ref={containerRef}
        line={line}
        isHebrew={isHebrew}
        fontSize={fontSize}
        measurementOptions={measurementOptions}
        editMode={editMode}
        onChordClick={onChordClick}
        onLyricCharacterClick={onLyricCharacterClick}
        onChordChipClick={onChordChipClick}
      />
    );
  }

  const handleLyricClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || !onLyricCharacterClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = isHebrew ? rect.right - e.clientX : e.clientX - rect.left;
    const position = getCharacterIndexFromClick(
      lyrics,
      clickX,
      fontSize,
      lyricsFontFamily,
      proportional,
      charWidth,
      isHebrew
    );
    onLyricCharacterClick(position);
  };

  return (
    <div
      ref={containerRef}
      className="mb-2 w-full"
      dir={getTextDirection(lyrics)}
      style={{ fontFamily: lyricsFontFamily, maxWidth: '100%', overflow: 'hidden' }}
    >
      <div
        className="relative min-h-[1.8rem] w-full font-semibold text-blue-600"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1.4,
          fontFamily: chordFontFamily,
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        <ChordButtons
          chords={chords}
          lyrics={lyrics}
          fontSize={fontSize}
          isHebrew={isHebrew}
          lyricsFontFamily={lyricsFontFamily}
          chordFontFamily={chordFontFamily}
          proportional={proportional}
          charWidth={charWidth}
          containerWidth={containerWidth}
          editMode={editMode}
          onChordClick={onChordClick}
          onChordChipClick={onChordChipClick}
        />
      </div>
      <div
        className={cn(
          'min-h-[1.8rem] w-full text-gray-900 dark:text-gray-100',
          editMode && 'cursor-text rounded-md hover:bg-muted/50'
        )}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1.4,
          fontFamily: lyricsFontFamily,
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          maxWidth: '100%',
        }}
        onClick={handleLyricClick}
        role={editMode ? 'button' : undefined}
        tabIndex={editMode ? 0 : undefined}
      >
        {lyrics}
      </div>
    </div>
  );
}
