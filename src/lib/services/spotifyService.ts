import { getSpotifyConfig } from '@/lib/config/spotify'

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

export async function getSpotifyUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
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
