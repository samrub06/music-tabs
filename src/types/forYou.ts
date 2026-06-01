import type { Song } from '@/types'

export interface ForYouArtistSong extends Song {
  inUserLibrary: boolean
  userSongId?: string
}

export interface PersonalizedForYouData {
  featuredSong: Song | null
  topArtist: string | null
  artistSongs: ForYouArtistSong[]
}
