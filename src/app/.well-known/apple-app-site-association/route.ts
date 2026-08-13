import { NextResponse } from 'next/server'

/**
 * Apple Universal Links association.
 * Replace TEAMID after creating the App ID in Apple Developer.
 */
const association = {
  applinks: {
    apps: [] as string[],
    details: [
      {
        appID: 'TEAMID.com.tabascomusic.app',
        paths: ['*', '/'],
      },
    ],
  },
  webcredentials: {
    apps: ['TEAMID.com.tabascomusic.app'],
  },
}

export async function GET() {
  return NextResponse.json(association, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
