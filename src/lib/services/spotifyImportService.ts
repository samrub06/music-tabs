import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getSpotifyAccessTokenForUser,
  getSpotifyPlaylistTracks,
  mapSpotifyTracksToParsedSongs,
} from '@/lib/services/spotifyService'
import {
  importParsedSongs,
  type ImportProgress,
  type ImportResult,
} from '@/lib/services/simplePlaylistImporter'
import type { Database } from '@/types/db'

export async function importSpotifyPlaylist(
  playlistId: string,
  userId: string,
  clientSupabase: SupabaseClient<Database>,
  options?: {
    targetFolderId?: string
    useAiOrganization?: boolean
    onProgress?: (progress: ImportProgress) => void
  }
): Promise<ImportResult> {
  const accessToken = await getSpotifyAccessTokenForUser(clientSupabase, userId)

  options?.onProgress?.({
    current: 0,
    total: 0,
    currentSong: 'Loading Spotify tracks...',
    status: 'parsing',
  })

  const tracks = await getSpotifyPlaylistTracks(accessToken, playlistId)
  const parsedSongs = mapSpotifyTracksToParsedSongs(tracks)

  if (parsedSongs.length === 0) {
    return {
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: ['No importable tracks found in this playlist'],
      songs: [],
    }
  }

  return importParsedSongs(
    parsedSongs,
    userId,
    options?.targetFolderId,
    options?.onProgress,
    clientSupabase,
    options?.useAiOrganization ?? false
  )
}
