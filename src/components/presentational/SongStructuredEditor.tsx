'use client';

import React, { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/context/LanguageContext';
import type { SongLine, SongSection } from '@/types';
import { formatSectionDisplayName } from '@/utils/sectionDisplayName';
import { getSongChordFontFamily, getSongLyricsFontFamily } from '@/utils/songFonts';
import { containsHebrew, getTextDirection } from '@/utils/rtl';
import ChordOverLyricsLine from '@/components/presentational/ChordOverLyricsLine';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SongStructuredEditorProps {
  sections: SongSection[];
  fontSize: number;
  isSaving: boolean;
  onUpdateLine: (sectionIndex: number, lineIndex: number, line: SongLine) => void;
  onAddSection: (name: string) => void;
  onDeleteSection: (sectionIndex: number) => void;
  onAddLine: (sectionIndex: number, lineType: SongLine['type']) => void;
  onDeleteLine: (sectionIndex: number, lineIndex: number) => void;
  onMoveLine: (sectionIndex: number, lineIndex: number, direction: 'up' | 'down') => void;
  onSave: () => void;
  onCancel: () => void;
}

interface ChordPopoverState {
  sectionIndex: number;
  lineIndex: number;
  position: number;
  chordIndex?: number;
  initialValue: string;
}

export default function SongStructuredEditor({
  sections,
  fontSize,
  isSaving,
  onUpdateLine,
  onAddSection,
  onDeleteSection,
  onAddLine,
  onDeleteLine,
  onMoveLine,
  onSave,
  onCancel,
}: SongStructuredEditorProps) {
  const { t } = useLanguage();
  const [chordPopover, setChordPopover] = useState<ChordPopoverState | null>(null);
  const [chordInput, setChordInput] = useState('');

  const openChordPopover = (state: ChordPopoverState) => {
    setChordPopover(state);
    setChordInput(state.initialValue);
  };

  const closeChordPopover = () => {
    setChordPopover(null);
    setChordInput('');
  };

  const applyChord = () => {
    if (!chordPopover) return;
    const trimmed = chordInput.trim();
    const { sectionIndex, lineIndex, position, chordIndex } = chordPopover;
    const line = sections[sectionIndex]?.lines[lineIndex];
    if (!line || line.type !== 'chord_over_lyrics') return;

    const chords = [...(line.chords ?? [])];

    if (!trimmed) {
      if (chordIndex !== undefined) {
        chords.splice(chordIndex, 1);
      }
    } else if (chordIndex !== undefined) {
      chords[chordIndex] = { chord: trimmed, position: chords[chordIndex].position };
    } else {
      const existingIndex = chords.findIndex((c) => c.position === position);
      if (existingIndex >= 0) {
        chords[existingIndex] = { chord: trimmed, position };
      } else {
        chords.push({ chord: trimmed, position });
        chords.sort((a, b) => a.position - b.position);
      }
    }

    onUpdateLine(sectionIndex, lineIndex, {
      ...line,
      chords,
    });
    closeChordPopover();
  };

  const nudgeChord = (sectionIndex: number, lineIndex: number, chordIndex: number, delta: number) => {
    const line = sections[sectionIndex]?.lines[lineIndex];
    if (!line || line.type !== 'chord_over_lyrics' || !line.chords) return;
    const chords = [...line.chords];
    const chord = chords[chordIndex];
    if (!chord) return;
    const lyricsLen = line.lyrics?.length ?? 0;
    const newPosition = Math.max(0, Math.min(lyricsLen, chord.position + delta));
    chords[chordIndex] = { ...chord, position: newPosition };
    chords.sort((a, b) => a.position - b.position);
    onUpdateLine(sectionIndex, lineIndex, { ...line, chords });
  };

  const handleAddSection = () => {
    const name = window.prompt(t('songEditor.sectionNamePrompt'));
    if (name?.trim()) {
      onAddSection(name.trim());
    }
  };

  const handleDeleteSection = (sectionIndex: number) => {
    if (window.confirm(t('songEditor.deleteSectionConfirm'))) {
      onDeleteSection(sectionIndex);
    }
  };

  const handleDeleteLine = (sectionIndex: number, lineIndex: number) => {
    if (window.confirm(t('songEditor.deleteLineConfirm'))) {
      onDeleteLine(sectionIndex, lineIndex);
    }
  };

  const renderLineEditor = (line: SongLine, sectionIndex: number, lineIndex: number) => {
    if (line.type === 'chords_only') {
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={line.chord_line ?? ''}
            onChange={(e) =>
              onUpdateLine(sectionIndex, lineIndex, {
                ...line,
                chord_line: e.target.value,
              })
            }
            dir="ltr"
            className="w-full rounded-xl border border-black/[0.06] bg-white/70 px-3 py-2 font-mono text-sm text-blue-700 focus:outline-none focus:ring-2 focus:ring-primary dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-blue-300"
            style={{ fontFamily: getSongChordFontFamily() }}
            placeholder={t('songEditor.chordLinePlaceholder')}
          />
        </div>
      );
    }

    if (line.type === 'chord_over_lyrics') {
      const isHebrew = containsHebrew(line.lyrics ?? '');

      return (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground">
            {t('songEditor.tapLyricsHint')}
          </p>
          <textarea
            value={line.lyrics ?? ''}
            onChange={(e) =>
              onUpdateLine(sectionIndex, lineIndex, {
                ...line,
                lyrics: e.target.value,
              })
            }
            dir={getTextDirection(line.lyrics ?? '')}
            rows={2}
            className="w-full rounded-xl border border-black/[0.06] bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-white/[0.08] dark:bg-white/[0.06]"
            style={{ fontFamily: getSongLyricsFontFamily(isHebrew) }}
            placeholder={t('songEditor.lyricsPlaceholder')}
          />
          <div className="rounded-xl border border-black/[0.06] bg-white/50 p-2 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <ChordOverLyricsLine
              line={line}
              fontSize={Math.max(fontSize, 16)}
              editMode
              onLyricCharacterClick={(position) =>
                openChordPopover({
                  sectionIndex,
                  lineIndex,
                  position,
                  initialValue: '',
                })
              }
              onChordChipClick={(chordIndex) => {
                const chord = line.chords?.[chordIndex];
                if (!chord) return;
                openChordPopover({
                  sectionIndex,
                  lineIndex,
                  position: chord.position,
                  chordIndex,
                  initialValue: chord.chord,
                });
              }}
            />
          </div>
          {line.chords && line.chords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {line.chords.map((chord, chordIndex) => (
                <div
                  key={`${chord.position}-${chordIndex}`}
                  className="flex items-center gap-1 rounded-full bg-muted/80 px-2 py-1 text-xs"
                >
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    {chord.chord}
                  </span>
                  <span className="text-muted-foreground">@{chord.position}</span>
                  <button
                    type="button"
                    onClick={() => nudgeChord(sectionIndex, lineIndex, chordIndex, -1)}
                    className="min-h-9 min-w-9 rounded-full hover:bg-background"
                    aria-label={t('songEditor.nudgeLeft')}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeChord(sectionIndex, lineIndex, chordIndex, 1)}
                    className="min-h-9 min-w-9 rounded-full hover:bg-background"
                    aria-label={t('songEditor.nudgeRight')}
                  >
                    →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    const isHebrew = containsHebrew(line.lyrics ?? '');
    return (
      <textarea
        value={line.lyrics ?? ''}
        onChange={(e) =>
          onUpdateLine(sectionIndex, lineIndex, {
            ...line,
            lyrics: e.target.value,
          })
        }
        dir={getTextDirection(line.lyrics ?? '')}
        rows={2}
        className="w-full rounded-xl border border-black/[0.06] bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-white/[0.08] dark:bg-white/[0.06]"
        style={{ fontFamily: getSongLyricsFontFamily(isHebrew) }}
        placeholder={t('songEditor.lyricsPlaceholder')}
      />
    );
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sections.map((section, sectionIndex) => (
          <div
            key={`${section.name}-${sectionIndex}`}
            className="rounded-2xl border border-black/[0.06] bg-white/70 p-3.5 backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.06]"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                [{formatSectionDisplayName(section.name, t)}]
              </h3>
              <button
                type="button"
                onClick={() => handleDeleteSection(sectionIndex)}
                className="flex min-h-9 min-w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={t('songEditor.deleteSection')}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {section.lines.map((line, lineIndex) => (
                <div
                  key={lineIndex}
                  className="rounded-xl border border-black/[0.04] bg-background/50 p-3 dark:border-white/[0.06]"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t(`songEditor.lineType.${line.type}`)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={lineIndex === 0}
                        onClick={() => onMoveLine(sectionIndex, lineIndex, 'up')}
                        className="flex min-h-9 min-w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted disabled:opacity-30"
                        aria-label={t('songEditor.moveUp')}
                      >
                        <ChevronUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={lineIndex === section.lines.length - 1}
                        onClick={() => onMoveLine(sectionIndex, lineIndex, 'down')}
                        className="flex min-h-9 min-w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted disabled:opacity-30"
                        aria-label={t('songEditor.moveDown')}
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLine(sectionIndex, lineIndex)}
                        className="flex min-h-9 min-w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={t('songEditor.deleteLine')}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {renderLineEditor(line, sectionIndex, lineIndex)}
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl text-xs"
                onClick={() => onAddLine(sectionIndex, 'lyrics_only')}
              >
                <PlusIcon className="mr-1 h-3.5 w-3.5" />
                {t('songEditor.addLyricsLine')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl text-xs"
                onClick={() => onAddLine(sectionIndex, 'chords_only')}
              >
                <PlusIcon className="mr-1 h-3.5 w-3.5" />
                {t('songEditor.addChordsLine')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl text-xs"
                onClick={() => onAddLine(sectionIndex, 'chord_over_lyrics')}
              >
                <PlusIcon className="mr-1 h-3.5 w-3.5" />
                {t('songEditor.addChordLyricsLine')}
              </Button>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-xl font-medium"
          onClick={handleAddSection}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          {t('songEditor.addSection')}
        </Button>
      </div>

      <div className="shrink-0 border-t border-black/[0.06] bg-background/95 p-4 backdrop-blur-xl dark:border-white/[0.08]">
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-10 rounded-xl font-medium"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="h-10 rounded-xl font-medium"
          >
            {isSaving ? t('songContent.saving') : t('songContent.save')}
          </Button>
        </div>
      </div>

      {chordPopover && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-background p-4 shadow-lg dark:border-white/[0.08]"
            role="dialog"
            aria-modal="true"
            aria-label={t('songEditor.chordDialogTitle')}
          >
            <h4 className="mb-3 text-sm font-medium">{t('songEditor.chordDialogTitle')}</h4>
            <input
              type="text"
              value={chordInput}
              onChange={(e) => setChordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyChord();
                if (e.key === 'Escape') closeChordPopover();
              }}
              autoFocus
              dir="ltr"
              placeholder="C, Am, F#m..."
              className="mb-3 w-full rounded-xl border border-black/[0.06] bg-white/70 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-white/[0.08] dark:bg-white/[0.06]"
            />
            <div className="flex justify-end gap-2">
              {chordPopover.chordIndex !== undefined && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="mr-auto rounded-xl"
                  onClick={() => {
                    if (!chordPopover || chordPopover.chordIndex === undefined) return;
                    const { sectionIndex, lineIndex, chordIndex } = chordPopover;
                    const line = sections[sectionIndex]?.lines[lineIndex];
                    if (!line || line.type !== 'chord_over_lyrics' || !line.chords) return;
                    const chords = line.chords.filter((_, i) => i !== chordIndex);
                    onUpdateLine(sectionIndex, lineIndex, { ...line, chords });
                    closeChordPopover();
                  }}
                >
                  {t('songEditor.deleteChord')}
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={closeChordPopover}>
                {t('common.cancel')}
              </Button>
              <Button type="button" size="sm" className="rounded-xl" onClick={applyChord}>
                {t('common.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
