import { absoluteUrl } from '@/lib/seo/site'

export const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
] as const

export const SPOTIFY_STATE_COOKIE = 'spotify_oauth_state'
export const SPOTIFY_STATE_MAX_AGE_SECONDS = 600

export interface SpotifyConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function getSpotifyRedirectUri(): string {
  const fromEnv = process.env.SPOTIFY_REDIRECT_URI?.trim()
  if (fromEnv) return fromEnv
  return absoluteUrl('/api/spotify/callback')
}

export function getSpotifyConfig(): SpotifyConfig | null {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim()
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    return null
  }

  return {
    clientId,
    clientSecret,
    redirectUri: getSpotifyRedirectUri(),
  }
}

export function buildSpotifyAuthorizeUrl(state: string, config: SpotifyConfig): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    scope: SPOTIFY_SCOPES.join(' '),
    state,
    show_dialog: 'false',
  })

  return `https://accounts.spotify.com/authorize?${params.toString()}`
}
