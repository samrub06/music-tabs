import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { importSpotifyPlaylist } from '@/lib/services/spotifyImportService'
import type { ImportProgress } from '@/lib/services/simplePlaylistImporter'
import { spotifyImportSchema } from '@/lib/validation/schemas'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playlistId, targetFolderId, useAiOrganization } = spotifyImportSchema.parse(body)

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const sendSSE = (data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        const onProgress = (progress: ImportProgress) => {
          sendSSE({ type: 'progress', data: progress })
        }

        try {
          const result = await importSpotifyPlaylist(playlistId, user.id, supabase, {
            targetFolderId: targetFolderId ?? undefined,
            useAiOrganization: useAiOrganization ?? false,
            onProgress,
          })

          sendSSE({
            type: 'complete',
            data: {
              message: 'Spotify playlist import completed',
              results: result,
            },
          })
          controller.close()
        } catch (error) {
          sendSSE({
            type: 'error',
            data: {
              error: 'Import failed',
              details: error instanceof Error ? error.message : 'Unknown error',
            },
          })
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Spotify import route error:', error)
    return NextResponse.json(
      {
        error: 'Invalid request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    )
  }
}
