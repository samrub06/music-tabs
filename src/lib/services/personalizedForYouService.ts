import type { SupabaseClient } from '@supabase/supabase-js'
import { findUserSongMatch } from '@/lib/utils/songLibraryMatch'
import { songRepo } from '@/lib/services/songRepo'
import type { Database } from '@/types/db'
import type { ForYouArtistSong, PersonalizedForYouData } from '@/types/forYou'

const ARTIST_SONGS_LIMIT = 15

async function getTopViewedSongId(
  client: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data, error } = await (client
    .from('daily_song_views') as any)
    .select('song_id')
    .eq('user_id', userId)

  if (error) throw error
  const rows = (data || []) as Array<{ song_id: string }>
  if (!rows.length) return null

  const counts = new Map<string, number>()
  for (const row of rows) {
    counts.set(row.song_id, (counts.get(row.song_id) ?? 0) + 1)
  }

  let topSongId: string | null = null
  let maxViews = 0
  Array.from(counts.entries()).forEach(([songId, count]) => {
    if (count > maxViews) {
      maxViews = count
      topSongId = songId
    }
  })

  return topSongId
}

export const personalizedForYouService = (client: SupabaseClient<Database>) => ({
  async getForYouData(userId: string): Promise<PersonalizedForYouData> {
    const repo = songRepo(client)
    const topSongId = await getTopViewedSongId(client, userId)

    if (!topSongId) {
      return { featuredSong: null, topArtist: null, artistSongs: [] }
    }

    const featuredSong = await repo.getSongLightweightById(topSongId)
    if (!featuredSong?.author?.trim()) {
      return { featuredSong, topArtist: null, artistSongs: [] }
    }

    const topArtist = featuredSong.author.trim()
    const catalogSongs = await repo.getPublicSongsByAuthorLightweight(
      topArtist,
      ARTIST_SONGS_LIMIT,
      featuredSong.id
    )

    const userSongs = await repo.getAllSongsLightweight()
    const artistSongs: ForYouArtistSong[] = catalogSongs.map((song) => {
      const match = findUserSongMatch(song, userSongs)
      return {
        ...song,
        inUserLibrary: !!match,
        userSongId: match?.id,
      }
    })

    return {
      featuredSong,
      topArtist,
      artistSongs,
    }
  },
})
