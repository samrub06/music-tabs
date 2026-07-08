import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createActionServerClient } from '@/lib/supabase/server'
import {
  buildSpotifyAuthorizeUrl,
  getSpotifyConfig,
  SPOTIFY_STATE_COOKIE,
  SPOTIFY_STATE_MAX_AGE_SECONDS,
} from '@/lib/config/spotify'

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

  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/', req.url)
    loginUrl.searchParams.set('next', '/api/spotify/auth')
    return NextResponse.redirect(loginUrl)
  }

  const state = crypto.randomUUID()
  const forceDialog = req.nextUrl.searchParams.get('force') === '1'
  const authorizeUrl = buildSpotifyAuthorizeUrl(state, config, { forceDialog })
  const response = NextResponse.redirect(authorizeUrl)

  response.cookies.set(SPOTIFY_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SPOTIFY_STATE_MAX_AGE_SECONDS,
    path: '/',
  })

  return response
}
