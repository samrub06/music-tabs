import { NextResponse } from 'next/server'

/**
 * Spotify OAuth entry point — redirects to Spotify and stores spotify_id on profile after callback.
 * Implementation pending Spotify app credentials.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Spotify integration is not configured yet' },
    { status: 501 }
  )
}
