import type { NewSongData } from '@/types'

export interface JewishChordBookSource {
  sourceSite: string
  sourceLabel: string
  sourceFile: string
  page: number
  tabId: string
}

export interface JewishChordBookSongReview {
  status: 'ai_transcribed' | 'needs_review' | 'approved'
  notes?: string
}

export interface JewishChordBookSong {
  slug: string
  title: string
  titleHebrew: string
  author: string
  key: string
  capo?: number | null
  content: string
  genre: string
  difficulty: string
  versionDescription?: string
  source: JewishChordBookSource
  review: JewishChordBookSongReview
}

export interface JewishChordBookExtractMeta {
  bookId: string
  bookTitleHebrew: string
  part: string
  sourceFile: string
  extractedAt: string
  extractionMethod: string
  reviewStatus: string
}

export interface JewishChordBookExtract {
  meta: JewishChordBookExtractMeta
  songs: JewishChordBookSong[]
}

export function toNewSongData(song: JewishChordBookSong): NewSongData {
  return {
    title: song.titleHebrew ? `${song.title} (${song.titleHebrew})` : song.title,
    author: song.author,
    content: song.content,
    key: song.key,
    capo: song.capo ?? undefined,
    versionDescription: song.versionDescription,
    sourceSite: song.source.sourceSite,
    tabId: song.source.tabId,
    genre: song.genre,
    difficulty: song.difficulty,
  }
}
