import { SHIR_LAMAALOT_CATALOG_SONG } from '@/data/catalogSongs/shirLamaalot'
import { KARDUNER_SONGS_PART1 } from '@/data/catalogSongs/kardunerSongsPart1'
import { KARDUNER_SONGS_PART2 } from '@/data/catalogSongs/kardunerSongsPart2'
import { KARDUNER_SONGS_PART3 } from '@/data/catalogSongs/kardunerSongsPart3'
import { KARDUNER_SONGS_PART4 } from '@/data/catalogSongs/kardunerSongsPart4'
import type { NewSongData } from '@/types'

export type KardunerCatalogSong = NewSongData & {
  slug: string
  genre: string
  difficulty: string
  decade: number
}

/** Book order — matches partition/ image timestamps (135532 → 135953). */
export const KARDUNER_CATALOG_SONGS: KardunerCatalogSong[] = [
  SHIR_LAMAALOT_CATALOG_SONG,
  ...KARDUNER_SONGS_PART1,
  ...KARDUNER_SONGS_PART2,
  ...KARDUNER_SONGS_PART3,
  ...KARDUNER_SONGS_PART4,
]

export const KARDUNER_PLAYLIST_TAB_IDS = KARDUNER_CATALOG_SONGS.map(
  (song) => song.tabId!
)
