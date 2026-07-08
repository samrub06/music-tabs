import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createActionServerClient } from '@/lib/supabase/server'
import {
  getSpotifyConfig,
  getSpotifyRedirectUri,
  SPOTIFY_STATE_COOKIE,
} from '@/lib/config/spotify'
import { profileRepo } from '@/lib/services/profileRepo'
import {
  exchangeSpotifyAuthorizationCode,
  getSpotifyUserProfile,
} from '@/lib/services/spotifyService'

function redirectWithSpotifyStatus(
  req: NextRequest,
  status: 'connected' | 'denied' | 'not_configured' | 'unauthorized' | 'invalid_state' | 'already_linked' | 'failed'
) {
  const url = new URL('/spotify', req.url)
  url.searchParams.set('spotify', status)
  return NextResponse.redirect(url)
}

export async function GET(req: NextRequest) {
  const config = getSpotifyConfig()
  if (!config) {
    return redirectWithSpotifyStatus(req, 'not_configured')
  }

  const { searchParams } = new URL(req.url)
  const error = searchParams.get('error')
  if (error) {
    return redirectWithSpotifyStatus(req, 'denied')
  }

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const savedState = req.cookies.get(SPOTIFY_STATE_COOKIE)?.value

  const clearStateCookie = (response: NextResponse) => {
    response.cookies.set(SPOTIFY_STATE_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    return response
  }

  if (!code || !state || !savedState || state !== savedState) {
    return clearStateCookie(redirectWithSpotifyStatus(req, 'invalid_state'))
  }

  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return clearStateCookie(redirectWithSpotifyStatus(req, 'unauthorized'))
  }

  try {
    const redirectUri = getSpotifyRedirectUri()
    const token = await exchangeSpotifyAuthorizationCode(code, redirectUri)
    const spotifyProfile = await getSpotifyUserProfile(token.access_token)

    const repo = profileRepo(supabase)
    const existingOwner = await repo.getProfile(user.id)
    if (existingOwner?.spotifyId === spotifyProfile.id) {
      if (token.refresh_token) {
        await repo.linkSpotifyAccount(user.id, spotifyProfile.id, token.refresh_token)
      }
      return clearStateCookie(redirectWithSpotifyStatus(req, 'connected'))
    }

    const { data: conflict, error: conflictError } = await (supabase.from('profiles') as any)
      .select('id')
      .eq('spotify_id', spotifyProfile.id)
      .neq('id', user.id)
      .maybeSingle()

    if (conflictError) throw conflictError
    if (conflict) {
      return clearStateCookie(redirectWithSpotifyStatus(req, 'already_linked'))
    }

    if (!token.refresh_token) {
      return clearStateCookie(redirectWithSpotifyStatus(req, 'failed'))
    }

    await repo.linkSpotifyAccount(
      user.id,
      spotifyProfile.id,
      token.refresh_token
    )
    return clearStateCookie(redirectWithSpotifyStatus(req, 'connected'))
  } catch (linkError) {
    console.error('Spotify OAuth callback failed:', linkError)

    const message = linkError instanceof Error ? linkError.message : ''
    if (message.includes('profiles_spotify_id_unique_idx') || message.includes('duplicate key')) {
      return clearStateCookie(redirectWithSpotifyStatus(req, 'already_linked'))
    }

    return clearStateCookie(redirectWithSpotifyStatus(req, 'failed'))
  }
}
