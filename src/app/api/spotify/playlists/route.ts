import { NextResponse } from 'next/server'
import { createActionServerClient } from '@/lib/supabase/server'
import { getSpotifyConfig } from '@/lib/config/spotify'
import {
  getSpotifyAccessTokenForUser,
  listSpotifyPlaylists,
} from '@/lib/services/spotifyService'
import { profileRepo } from '@/lib/services/profileRepo'

export async function GET() {
  const config = getSpotifyConfig()
  if (!config) {
    return NextResponse.json({ error: 'Spotify integration is not configured' }, { status: 501 })
  }

  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const spotifyId = await profileRepo(supabase).getSpotifyId(user.id)
  if (!spotifyId) {
    return NextResponse.json({ error: 'Spotify account not connected' }, { status: 400 })
  }

  try {
    const accessToken = await getSpotifyAccessTokenForUser(supabase, user.id)
    const playlists = await listSpotifyPlaylists(accessToken)
    return NextResponse.json({ playlists })
  } catch (error) {
    console.error('Failed to list Spotify playlists:', error)
    return NextResponse.json(
      {
        error: 'Failed to load Spotify playlists',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
