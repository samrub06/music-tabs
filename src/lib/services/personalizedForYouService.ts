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
  try {
    const { data, error } = await (client.from('daily_song_views') as any)
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
  } catch (error) {
    console.error('getTopViewedSongId failed:', error)
    return null
  }
}

/** Fallback when daily_song_views is empty: artist with the most songs in the user's library. */
function getTopArtistFromUserLibrary(
  userSongs: Array<{ id: string; author: string }>
): { songId: string; artist: string } | null {
  const byArtist = new Map<string, { count: number; songId: string; displayName: string }>()

  for (const song of userSongs) {
    const displayName = song.author?.trim()
    if (!displayName) continue
    const key = displayName.toLowerCase()
    const existing = byArtist.get(key)
    if (!existing) {
      byArtist.set(key, { count: 1, songId: song.id, displayName })
    } else {
      byArtist.set(key, { ...existing, count: existing.count + 1 })
    }
  }

  let top: { count: number; songId: string; displayName: string } | null = null
  for (const entry of Array.from(byArtist.values())) {
    if (!top || entry.count > top.count) {
      top = entry
    }
  }

  return top ? { songId: top.songId, artist: top.displayName } : null
}

export const personalizedForYouService = (client: SupabaseClient<Database>) => ({
  async getForYouData(userId: string): Promise<PersonalizedForYouData> {
    const repo = songRepo(client)

    try {
      const userSongs = await repo.getAllSongsLightweight()

      let topSongId = await getTopViewedSongId(client, userId)
      let topArtist: string | null = null

      if (topSongId) {
        const featuredFromViews = await repo.getSongLightweightById(topSongId)
        topArtist = featuredFromViews?.author?.trim() ?? null
      }

      if (!topArtist && userSongs.length > 0) {
        const fallback = getTopArtistFromUserLibrary(userSongs)
        if (fallback) {
          topSongId = fallback.songId
          topArtist = fallback.artist
        }
      }

      if (!topArtist) {
        return { featuredSong: null, topArtist: null, artistSongs: [] }
      }

      const featuredSong = topSongId
        ? await repo.getSongLightweightById(topSongId)
        : null

      const catalogSongs = await repo.getMergedArtistSongsLightweight(
        topArtist,
        ARTIST_SONGS_LIMIT
      )

      const artistSongs: ForYouArtistSong[] = catalogSongs.map((song) => {
        const match = findUserSongMatch(song, userSongs)
        return {
          ...song,
          inUserLibrary: !!match,
          userSongId: match?.id,
        }
      })

      return {
        featuredSong: featuredSong ?? artistSongs[0] ?? null,
        topArtist,
        artistSongs,
      }
    } catch (error) {
      console.error('getForYouData failed:', error)
      return { featuredSong: null, topArtist: null, artistSongs: [] }
    }
  },
})
