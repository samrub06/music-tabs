import type { SupabaseClient } from '@supabase/supabase-js'
import { getSpotifyConfig } from '@/lib/config/spotify'
import { profileRepo } from '@/lib/services/profileRepo'
import type { Database } from '@/types/db'
import type { ParsedSong } from '@/lib/services/simplePlaylistImporter'

export interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in: number
  refresh_token?: string
}

export interface SpotifyUserProfile {
  id: string
  display_name: string | null
  email: string | null
}

export interface SpotifyPlaylistSummary {
  id: string
  name: string
  trackCount: number
  imageUrl: string | null
  ownerName: string | null
}

export interface SpotifyPlaylistTrack {
  title: string
  artist: string
}

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'
const DEFAULT_IMPORT_TRACK_LIMIT = 80

function getBasicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
}

export async function exchangeSpotifyAuthorizationCode(
  code: string,
  redirectUri: string
): Promise<SpotifyTokenResponse> {
  const config = getSpotifyConfig()
  if (!config) {
    throw new Error('Spotify integration is not configured')
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: getBasicAuthHeader(config.clientId, config.clientSecret),
    },
    body,
    cache: 'no-store',
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`Spotify token exchange failed (${response.status}): ${details}`)
  }

  return (await response.json()) as SpotifyTokenResponse
}

export async function refreshSpotifyAccessToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const config = getSpotifyConfig()
  if (!config) {
    throw new Error('Spotify integration is not configured')
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: getBasicAuthHeader(config.clientId, config.clientSecret),
    },
    body,
    cache: 'no-store',
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`Spotify token refresh failed (${response.status}): ${details}`)
  }

  return (await response.json()) as SpotifyTokenResponse
}

export async function getSpotifyAccessTokenForUser(
  client: SupabaseClient<Database>,
  userId: string
): Promise<string> {
  const repo = profileRepo(client)
  const refreshToken = await repo.getSpotifyRefreshToken(userId)
  if (!refreshToken) {
    throw new Error('Spotify account is not connected')
  }

  const token = await refreshSpotifyAccessToken(refreshToken)
  if (token.refresh_token && token.refresh_token !== refreshToken) {
    await repo.updateSpotifyRefreshToken(userId, token.refresh_token)
  }

  return token.access_token
}

export async function getSpotifyUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`Spotify profile fetch failed (${response.status}): ${details}`)
  }

  const payload = (await response.json()) as {
    id: string
    display_name?: string | null
    email?: string | null
  }

  return {
    id: payload.id,
    display_name: payload.display_name ?? null,
    email: payload.email ?? null,
  }
}

export async function listSpotifyPlaylists(accessToken: string): Promise<SpotifyPlaylistSummary[]> {
  const playlists: SpotifyPlaylistSummary[] = []
  let url: string | null = `${SPOTIFY_API_BASE}/me/playlists?limit=50`

  while (url) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })

    if (!response.ok) {
      const details = await response.text().catch(() => '')
      throw new Error(`Spotify playlists fetch failed (${response.status}): ${details}`)
    }

    const payload = (await response.json()) as {
      items: Array<{
        id: string
        name: string
        images?: Array<{ url: string }>
        owner?: { display_name?: string | null }
        tracks?: { total?: number }
      }>
      next?: string | null
    }

    for (const item of payload.items ?? []) {
      playlists.push({
        id: item.id,
        name: item.name,
        trackCount: item.tracks?.total ?? 0,
        imageUrl: item.images?.[0]?.url ?? null,
        ownerName: item.owner?.display_name ?? null,
      })
    }

    url = payload.next ?? null
  }

  return playlists.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getSpotifyPlaylistTracks(
  accessToken: string,
  playlistId: string,
  maxTracks = DEFAULT_IMPORT_TRACK_LIMIT
): Promise<SpotifyPlaylistTrack[]> {
  const tracks: SpotifyPlaylistTrack[] = []
  let url: string | null =
    `${SPOTIFY_API_BASE}/playlists/${encodeURIComponent(playlistId)}/tracks?limit=100&fields=items(track(name,artists(name))),next`

  while (url && tracks.length < maxTracks) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })

    if (!response.ok) {
      const details = await response.text().catch(() => '')
      throw new Error(`Spotify playlist tracks fetch failed (${response.status}): ${details}`)
    }

    const payload = (await response.json()) as {
      items: Array<{
        track: {
          name?: string
          artists?: Array<{ name?: string }>
        } | null
      }>
      next?: string | null
    }

    for (const item of payload.items ?? []) {
      if (!item.track?.name) continue
      const artist = item.track.artists?.[0]?.name?.trim()
      if (!artist) continue

      tracks.push({
        title: item.track.name.trim(),
        artist,
      })

      if (tracks.length >= maxTracks) break
    }

    url = tracks.length >= maxTracks ? null : payload.next ?? null
  }

  return tracks
}

export function mapSpotifyTracksToParsedSongs(tracks: SpotifyPlaylistTrack[]): ParsedSong[] {
  const seen = new Set<string>()
  const parsed: ParsedSong[] = []

  for (const track of tracks) {
    const key = `${track.title.toLowerCase()}|${track.artist.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    parsed.push({ title: track.title, artist: track.artist })
  }

  return parsed
}
