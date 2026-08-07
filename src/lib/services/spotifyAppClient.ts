/**
 * App-level Spotify client for public playlist reads (ops scripts).
 *
 * Auth order:
 * 1. SPOTIFY_OPS_REFRESH_TOKEN — user refresh token (required for Spotify-owned
 *    Charts / editorial playlists like Top 50 — client credentials get 403)
 * 2. Client credentials — works for many user-created public playlists only
 */
import { getSpotifyConfig } from '@/lib/config/spotify'
import {
  getSpotifyPlaylistTracks,
  refreshSpotifyAccessToken,
  type SpotifyPlaylistTrack,
} from '@/lib/services/spotifyService'

type TokenCache = {
  accessToken: string
  expiresAtMs: number
  mode: 'ops-refresh' | 'client-credentials'
}

let tokenCache: TokenCache | null = null

function getOpsRefreshToken(): string | null {
  return process.env.SPOTIFY_OPS_REFRESH_TOKEN?.trim() || null
}

async function fetchClientCredentialsToken(): Promise<string> {
  const config = getSpotifyConfig()
  if (!config) {
    throw new Error(
      'Spotify is not configured (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET)'
    )
  }

  const body = new URLSearchParams({ grant_type: 'client_credentials' })
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${config.clientId}:${config.clientSecret}`
      ).toString('base64')}`,
    },
    body,
    cache: 'no-store',
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(
      `Spotify client-credentials token failed (${response.status}): ${details}`
    )
  }

  const payload = (await response.json()) as {
    access_token: string
    expires_in: number
  }

  tokenCache = {
    accessToken: payload.access_token,
    expiresAtMs: Date.now() + payload.expires_in * 1000,
    mode: 'client-credentials',
  }

  return payload.access_token
}

async function getAppAccessToken(): Promise<string> {
  const now = Date.now()
  if (tokenCache && tokenCache.expiresAtMs > now + 30_000) {
    return tokenCache.accessToken
  }

  const opsRefresh = getOpsRefreshToken()
  if (opsRefresh) {
    const token = await refreshSpotifyAccessToken(opsRefresh)
    tokenCache = {
      accessToken: token.access_token,
      expiresAtMs: now + token.expires_in * 1000,
      mode: 'ops-refresh',
    }
    if (token.refresh_token) {
      console.warn(
        '[spotifyAppClient] Spotify returned a new refresh token — update SPOTIFY_OPS_REFRESH_TOKEN if the old one stops working.'
      )
    }
    return token.access_token
  }

  return fetchClientCredentialsToken()
}

/** Fetch playlist tracks via ops refresh token or client credentials. */
export async function fetchPublicPlaylistTracks(
  playlistId: string,
  maxTracks = 50
): Promise<SpotifyPlaylistTrack[]> {
  const accessToken = await getAppAccessToken()
  try {
    return await getSpotifyPlaylistTracks(accessToken, playlistId, maxTracks)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('403') && !getOpsRefreshToken()) {
      throw new Error(
        `${message}\n\nSpotify Charts/editorial playlists (IDs starting with 37i9…) usually require a user token.\n` +
          `Set SPOTIFY_OPS_REFRESH_TOKEN in .env.local (refresh token from a Spotify-connected account),\n` +
          `or replace chart IDs in spotifyPopularSources.ts with a public user-created playlist ID.`
      )
    }
    throw error
  }
}

export function clearSpotifyAppTokenCache(): void {
  tokenCache = null
}

export function getSpotifyAppAuthMode(): 'ops-refresh' | 'client-credentials' | 'unconfigured' {
  if (getOpsRefreshToken()) return 'ops-refresh'
  if (getSpotifyConfig()) return 'client-credentials'
  return 'unconfigured'
}
