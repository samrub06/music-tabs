import { useState, useEffect, useCallback } from 'react';
import { Song, SongEditData, SongLine, SongSection } from '@/types';

interface UseSongEditorProps {
  song: Song;
  updateSong: (id: string, data: SongEditData) => Promise<void>;
  getMessage?: (key: string) => string;
}

function cloneSections(sections: SongSection[]): SongSection[] {
  return JSON.parse(JSON.stringify(sections)) as SongSection[];
}

export function normalizeSectionsForSave(sections: SongSection[]): SongSection[] {
  return sections.map((section) => ({
    ...section,
    lines: section.lines.map((line) => {
      if (
        line.type === 'chord_over_lyrics' &&
        (!line.chords || line.chords.length === 0)
      ) {
        return { type: 'lyrics_only' as const, lyrics: line.lyrics ?? '' };
      }
      return line;
    }),
  }));
}

export function useSongEditor({ song, updateSong, getMessage }: UseSongEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editSections, setEditSections] = useState<SongSection[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (song) {
      setEditSections(cloneSections(song.sections ?? []));
    }
  }, [song]);

  const markDirty = useCallback(() => setHasUnsavedChanges(true), []);

  const updateSection = useCallback(
    (sectionIndex: number, section: SongSection) => {
      setEditSections((prev) => {
        const next = cloneSections(prev);
        next[sectionIndex] = section;
        return next;
      });
      markDirty();
    },
    [markDirty]
  );

  const updateLine = useCallback(
    (sectionIndex: number, lineIndex: number, line: SongLine) => {
      setEditSections((prev) => {
        const next = cloneSections(prev);
        next[sectionIndex].lines[lineIndex] = line;
        return next;
      });
      markDirty();
    },
    [markDirty]
  );

  const addSection = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setEditSections((prev) => [
        ...prev,
        {
          type: 'verse',
          name: trimmed,
          lines: [{ type: 'lyrics_only', lyrics: '' }],
        },
      ]);
      markDirty();
    },
    [markDirty]
  );

  const deleteSection = useCallback(
    (sectionIndex: number) => {
      setEditSections((prev) => prev.filter((_, i) => i !== sectionIndex));
      markDirty();
    },
    [markDirty]
  );

  const addLine = useCallback(
    (sectionIndex: number, lineType: SongLine['type']) => {
      setEditSections((prev) => {
        const next = cloneSections(prev);
        const newLine: SongLine =
          lineType === 'chords_only'
            ? { type: 'chords_only', chord_line: '' }
            : lineType === 'chord_over_lyrics'
              ? { type: 'chord_over_lyrics', lyrics: '', chords: [] }
              : { type: 'lyrics_only', lyrics: '' };
        next[sectionIndex].lines.push(newLine);
        return next;
      });
      markDirty();
    },
    [markDirty]
  );

  const deleteLine = useCallback(
    (sectionIndex: number, lineIndex: number) => {
      setEditSections((prev) => {
        const next = cloneSections(prev);
        next[sectionIndex].lines = next[sectionIndex].lines.filter(
          (_, i) => i !== lineIndex
        );
        return next;
      });
      markDirty();
    },
    [markDirty]
  );

  const moveLine = useCallback(
    (sectionIndex: number, lineIndex: number, direction: 'up' | 'down') => {
      setEditSections((prev) => {
        const next = cloneSections(prev);
        const lines = next[sectionIndex].lines;
        const targetIndex = direction === 'up' ? lineIndex - 1 : lineIndex + 1;
        if (targetIndex < 0 || targetIndex >= lines.length) return prev;
        [lines[lineIndex], lines[targetIndex]] = [lines[targetIndex], lines[lineIndex]];
        return next;
      });
      markDirty();
    },
    [markDirty]
  );

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const songEditData: SongEditData = {
        title: song.title,
        author: song.author,
        sections: normalizeSectionsForSave(editSections),
        folderId: song.folderId,
      };

      await updateSong(song.id, songEditData);
      setIsEditing(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving song:', error);
      alert(getMessage ? getMessage('errors.failedToSave') : 'Failed to save song.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        getMessage
          ? getMessage('songEditor.unsavedChangesConfirm')
          : 'Discard unsaved changes?'
      )
    ) {
      return;
    }
    setIsEditing(false);
    setEditSections(cloneSections(song.sections ?? []));
    setHasUnsavedChanges(false);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      handleCancelEdit();
      return;
    }
    setEditSections(cloneSections(song.sections ?? []));
    setHasUnsavedChanges(false);
    setIsEditing(true);
  };

  return {
    isEditing,
    editSections,
    isSaving,
    hasUnsavedChanges,
    setEditSections,
    updateSection,
    updateLine,
    addSection,
    deleteSection,
    addLine,
    deleteLine,
    moveLine,
    handleSave,
    handleCancelEdit,
    handleToggleEdit,
  };
}
