'use client'

import { useState, useMemo } from 'react'
import {
  MusicalNoteIcon,
  SparklesIcon,
  FolderIcon,
  ClockIcon,
  KeyIcon,
  ArrowPathIcon,
  TagIcon,
} from '@heroicons/react/24/outline'
import {
  PlaylistResult,
  generatePlaylistSequence,
  getRandomSongs,
} from '@/lib/services/playlistGeneratorService'
import { Song, Folder } from '@/types'
import { useLanguage } from '@/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface PlaylistGeneratorProps {
  songs: Song[]
  folders: Folder[]
  onPlaylistGenerated: (result: PlaylistResult, meta?: { genreId?: string }) => void
}

const sectionCardClass =
  'rounded-2xl bg-white/70 dark:bg-white/[0.06] backdrop-blur-md border border-black/[0.06] dark:border-white/[0.08] p-3.5 space-y-2.5'

const sectionLabelClass = 'text-[11px] font-medium text-muted-foreground flex items-center gap-1.5'

const checkboxClass =
  'h-4 w-4 shrink-0 rounded border border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0'

const scrollListClass =
  'max-h-36 overflow-y-auto rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-muted/40 dark:bg-muted/20 p-2.5 space-y-1'

export default function PlaylistGenerator({
  songs,
  folders,
  onPlaylistGenerated,
}: PlaylistGeneratorProps) {
  const { t } = useLanguage()
  const [targetKey, setTargetKey] = useState('')
  const [selectedFolders, setSelectedFolders] = useState<string[]>([])
  const [selectedSongs, setSelectedSongs] = useState<string[]>([])
  const [selectedGenre, setSelectedGenre] = useState('')
  const [useRandomSelection, setUseRandomSelection] = useState(false)
  const [maxSongs, setMaxSongs] = useState(10)
  const [isGenerating, setIsGenerating] = useState(false)

  const availableKeys = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
  ]

  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>()
    songs.forEach((song) => {
      if (song.genre) genreSet.add(song.genre)
    })
    return Array.from(genreSet).sort()
  }, [songs])

  const handleFolderToggle = (folderId: string) => {
    setSelectedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    )
  }

  const handleSongToggle = (songId: string) => {
    setSelectedSongs((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    )
  }

  const filteredSongs = useMemo(() => {
    let filtered = songs
    if (selectedFolders.length > 0) {
      filtered = filtered.filter((song) =>
        selectedFolders.includes(song.folderId || 'unorganized')
      )
    }
    if (selectedGenre) {
      filtered = filtered.filter((song) => song.genre === selectedGenre)
    }
    return filtered
  }, [songs, selectedFolders, selectedGenre])

  const handleGeneratePlaylist = async () => {
    setIsGenerating(true)
    try {
      let candidateSongs = [...songs]

      if (selectedFolders.length > 0) {
        candidateSongs = candidateSongs.filter((s) =>
          selectedFolders.includes(s.folderId || 'unorganized')
        )
      }

      if (selectedSongs.length > 0) {
        const selectedSet = new Set(selectedSongs)
        candidateSongs = candidateSongs.filter((s) => selectedSet.has(s.id))
      }

      if (useRandomSelection) {
        candidateSongs = getRandomSongs(candidateSongs, maxSongs)
      }

      const result = generatePlaylistSequence(candidateSongs, {
        targetKey: targetKey || undefined,
        selectedFolders: selectedFolders.length > 0 ? selectedFolders : undefined,
        selectedSongs: selectedSongs.length > 0 ? selectedSongs : undefined,
        genre: selectedGenre || undefined,
        useRandomSelection,
        maxSongs,
      })

      onPlaylistGenerated(result, { genreId: selectedGenre || undefined })
    } catch (error) {
      console.error('Error generating playlist:', error)
      alert(t('errors.playlistGenerationError'))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={sectionCardClass}>
          <Label className={sectionLabelClass}>
            <KeyIcon className="h-3.5 w-3.5" />
            {t('playlistGenerator.preferredKey')}
          </Label>
          <Select value={targetKey || '__none__'} onValueChange={(v) => setTargetKey(v === '__none__' ? '' : v)}>
            <SelectTrigger className="h-10 w-full rounded-xl bg-background">
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

        {availableGenres.length > 0 ? (
          <div className={sectionCardClass}>
            <Label className={sectionLabelClass}>
              <TagIcon className="h-3.5 w-3.5" />
              {t('playlistGenerator.genre')}
            </Label>
            <Select
              value={selectedGenre || '__all__'}
              onValueChange={(v) => setSelectedGenre(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="h-10 w-full rounded-xl bg-background">
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
        ) : (
          <div className={sectionCardClass}>
            <Label className={sectionLabelClass}>
              <ClockIcon className="h-3.5 w-3.5" />
              {t('playlistGenerator.maxSongs')}
            </Label>
            <Input
              type="number"
              min={2}
              max={20}
              value={maxSongs}
              onChange={(e) => setMaxSongs(parseInt(e.target.value, 10) || 10)}
              className="h-10 rounded-xl bg-background"
            />
          </div>
        )}
      </div>

      <div className={sectionCardClass}>
        <Label className={sectionLabelClass}>
          <FolderIcon className="h-3.5 w-3.5" />
          {t('playlistGenerator.folders')}
        </Label>
        <div className={scrollListClass}>
          <label className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted/60">
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
              className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted/60"
            >
              <input
                type="checkbox"
                checked={selectedFolders.includes(folder.id)}
                onChange={() => handleFolderToggle(folder.id)}
                className={checkboxClass}
              />
              <span className="truncate">
                {folder.name}{' '}
                <span className="text-muted-foreground">
                  ({songs.filter((s) => s.folderId === folder.id).length})
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className={sectionCardClass}>
        <Label className={sectionLabelClass}>
          <MusicalNoteIcon className="h-3.5 w-3.5" />
          {t('playlistGenerator.specificSongs')}
        </Label>
        <div className={cn(scrollListClass, 'max-h-44')}>
          {filteredSongs.slice(0, 20).map((song) => (
            <label
              key={song.id}
              className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted/60"
            >
              <input
                type="checkbox"
                checked={selectedSongs.includes(song.id)}
                onChange={() => handleSongToggle(song.id)}
                className={checkboxClass}
              />
              <span className="min-w-0 truncate">
                {song.title}
                <span className="text-muted-foreground"> — {song.author}</span>
                {song.key && (
                  <span className="ms-1 text-amber-700 dark:text-amber-400">({song.key})</span>
                )}
              </span>
            </label>
          ))}
          {filteredSongs.length > 20 && (
            <p className="px-2 pt-1 text-xs text-muted-foreground">
              {t('playlistGenerator.andMore').replace(
                '{count}',
                String(filteredSongs.length - 20)
              )}
            </p>
          )}
          {filteredSongs.length === 0 && (
            <p className="px-2 py-2 text-xs text-muted-foreground">{t('songs.noSongs')}</p>
          )}
        </div>
      </div>

      <div className={cn(sectionCardClass, 'sm:flex sm:items-end sm:gap-3')}>
        <label className="flex min-h-10 flex-1 cursor-pointer items-center gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={useRandomSelection}
            onChange={(e) => setUseRandomSelection(e.target.checked)}
            className={checkboxClass}
          />
          <span>{t('playlistGenerator.randomSelection')}</span>
        </label>

        {availableGenres.length > 0 && (
          <div className="w-full space-y-2 sm:w-36">
            <Label className={sectionLabelClass}>
              <ClockIcon className="h-3.5 w-3.5" />
              {t('playlistGenerator.maxSongs')}
            </Label>
            <Input
              type="number"
              min={2}
              max={20}
              value={maxSongs}
              onChange={(e) => setMaxSongs(parseInt(e.target.value, 10) || 10)}
              className="h-10 rounded-xl bg-background"
            />
          </div>
        )}
      </div>

      <Button
        type="button"
        className="h-11 w-full rounded-xl font-medium"
        onClick={() => void handleGeneratePlaylist()}
        disabled={isGenerating || songs.length === 0}
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
  )
}
