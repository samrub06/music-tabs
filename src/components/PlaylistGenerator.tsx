'use client';

import { useState, useMemo } from 'react';
import {
  MusicalNoteIcon,
  SparklesIcon,
  FolderIcon,
  ClockIcon,
  KeyIcon,
  ArrowPathIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import {
  PlaylistResult,
  generatePlaylistSequence,
  getRandomSongs,
} from '@/lib/services/playlistGeneratorService';
import { Song, Folder } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PlaylistGeneratorProps {
  songs: Song[];
  folders: Folder[];
  onPlaylistGenerated: (result: PlaylistResult) => void;
}

const checkboxClass =
  'h-4 w-4 shrink-0 rounded border border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0';

const scrollListClass =
  'max-h-32 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 space-y-2';

export default function PlaylistGenerator({
  songs,
  folders,
  onPlaylistGenerated,
}: PlaylistGeneratorProps) {
  const { t } = useLanguage();
  const [targetKey, setTargetKey] = useState('');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [useRandomSelection, setUseRandomSelection] = useState(false);
  const [maxSongs, setMaxSongs] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);

  const availableKeys = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
  ];

  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    songs.forEach((song) => {
      if (song.genre) genreSet.add(song.genre);
    });
    return Array.from(genreSet).sort();
  }, [songs]);

  const handleFolderToggle = (folderId: string) => {
    setSelectedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  const handleSongToggle = (songId: string) => {
    setSelectedSongs((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  };

  const getFilteredSongs = () => {
    let filtered = songs;
    if (selectedFolders.length > 0) {
      filtered = filtered.filter((song) =>
        selectedFolders.includes(song.folderId || 'unorganized')
      );
    }
    if (selectedGenre) {
      filtered = filtered.filter((song) => song.genre === selectedGenre);
    }
    return filtered;
  };

  const filteredSongs = getFilteredSongs();

  const handleGeneratePlaylist = async () => {
    setIsGenerating(true);
    try {
      let candidateSongs = [...songs];

      if (selectedFolders.length > 0) {
        candidateSongs = candidateSongs.filter((s) =>
          selectedFolders.includes(s.folderId || 'unorganized')
        );
      }

      if (selectedSongs.length > 0) {
        const selectedSet = new Set(selectedSongs);
        candidateSongs = candidateSongs.filter((s) => selectedSet.has(s.id));
      }

      if (useRandomSelection) {
        candidateSongs = getRandomSongs(candidateSongs, maxSongs);
      }

      const result = generatePlaylistSequence(candidateSongs, {
        targetKey: targetKey || undefined,
        selectedFolders: selectedFolders.length > 0 ? selectedFolders : undefined,
        selectedSongs: selectedSongs.length > 0 ? selectedSongs : undefined,
        genre: selectedGenre || undefined,
        useRandomSelection,
        maxSongs,
      });

      onPlaylistGenerated(result);
    } catch (error) {
      console.error('Error generating playlist:', error);
      alert(t('errors.playlistGenerationError'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-foreground">
            <KeyIcon className="h-4 w-4 text-muted-foreground" />
            {t('playlistGenerator.preferredKey')}
          </Label>
          <Select value={targetKey || '__none__'} onValueChange={(v) => setTargetKey(v === '__none__' ? '' : v)}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder={t('playlistGenerator.noSpecificKey')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t('playlistGenerator.noSpecificKey')}</SelectItem>
              {availableKeys.map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {availableGenres.length > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <TagIcon className="h-4 w-4 text-muted-foreground" />
              {t('playlistGenerator.genre')}
            </Label>
            <Select value={selectedGenre || '__all__'} onValueChange={(v) => setSelectedGenre(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder={t('playlistGenerator.allGenres')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('playlistGenerator.allGenres')}</SelectItem>
                {availableGenres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-foreground">
            <FolderIcon className="h-4 w-4 text-muted-foreground" />
            {t('playlistGenerator.folders')}
          </Label>
          <div className={scrollListClass}>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFolders.includes('unorganized')}
                onChange={() => handleFolderToggle('unorganized')}
                className={checkboxClass}
              />
              <span>
                {t('playlistGenerator.unorganized').replace(
                  '{count}',
                  String(songs.filter((s) => !s.folderId).length)
                )}
              </span>
            </label>
            {folders.map((folder) => (
              <label
                key={folder.id}
                className="flex items-center gap-2 text-sm text-foreground cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedFolders.includes(folder.id)}
                  onChange={() => handleFolderToggle(folder.id)}
                  className={checkboxClass}
                />
                <span>
                  {folder.name} ({songs.filter((s) => s.folderId === folder.id).length})
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-foreground">
            <MusicalNoteIcon className="h-4 w-4 text-muted-foreground" />
            {t('playlistGenerator.specificSongs')}
          </Label>
          <div className={cn(scrollListClass, 'max-h-40')}>
            {filteredSongs.slice(0, 20).map((song) => (
              <label
                key={song.id}
                className="flex items-center gap-2 text-sm text-foreground cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedSongs.includes(song.id)}
                  onChange={() => handleSongToggle(song.id)}
                  className={checkboxClass}
                />
                <span className="truncate">
                  {song.title} — {song.author}
                  {song.key && (
                    <span className="ml-1 text-primary">({song.key})</span>
                  )}
                </span>
              </label>
            ))}
            {filteredSongs.length > 20 && (
              <p className="text-xs text-muted-foreground">
                {t('playlistGenerator.andMore').replace(
                  '{count}',
                  String(filteredSongs.length - 20)
                )}
              </p>
            )}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={useRandomSelection}
            onChange={(e) => setUseRandomSelection(e.target.checked)}
            className={checkboxClass}
          />
          <span>{t('playlistGenerator.randomSelection')}</span>
        </label>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-foreground">
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
            {t('playlistGenerator.maxSongs')}
          </Label>
          <Input
            type="number"
            min={2}
            max={20}
            value={maxSongs}
            onChange={(e) => setMaxSongs(parseInt(e.target.value, 10) || 10)}
            className="bg-background"
          />
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={handleGeneratePlaylist}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {t('playlistGenerator.generating')}
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4" />
              {t('playlistGenerator.generate')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
