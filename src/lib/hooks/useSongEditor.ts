import { useState, useEffect } from 'react';
import { Song, SongEditData } from '@/types';
import { renderStructuredSong } from '@/utils/structuredSong';

interface UseSongEditorProps {
  song: Song;
  updateSong: (id: string, data: SongEditData) => Promise<void>;
}

export function useSongEditor({ song, updateSong }: UseSongEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize edit content when song changes
  useEffect(() => {
    if (song) {
      setEditContent(renderStructuredSong(song));
    }
  }, [song]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const lines = editContent.split('\n');
      let title = song.title;
      let author = song.author;
      let content = editContent;

      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        if (firstLine && !firstLine.startsWith('[') && !firstLine.startsWith('{')) {
          title = firstLine;
        }
      }

      const authorLine = lines.find(line => 
        line.trim().toLowerCase().startsWith('par ') || 
        line.trim().toLowerCase().startsWith('by ')
      );
      if (authorLine) {
        author = authorLine.replace(/^(par |by )/i, '').trim();
      }

      const songEditData: SongEditData = {
        title,
        author,
        content,
        folderId: song.folderId
      };
      
      await updateSong(song.id, songEditData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving song:', error);
      alert('Erreur lors de la sauvegarde de la chanson');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(renderStructuredSong(song));
  };

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return {
    isEditing,
    editContent,
    isSaving,
    setEditContent,
    handleSave,
    handleCancelEdit,
    handleToggleEdit
  };
}
