import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createActionServerClient } from '@/lib/supabase/server'
import { importSpotifyPlaylist } from '@/lib/services/spotifyImportService'
import type { ImportProgress } from '@/lib/services/simplePlaylistImporter'
import { spotifyImportSchema } from '@/lib/validation/schemas'
import type { Database } from '@/types/db'
import type { SupabaseClient } from '@supabase/supabase-js'

export const maxDuration = 300

async function resolveSupabaseUser(request: NextRequest): Promise<{
  userId: string
  supabase: SupabaseClient<Database>
} | null> {
  const authHeader = request.headers.get('authorization')

  if (authHeader) {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (!error && user) {
      return { userId: user.id, supabase }
    }
  }

  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null
  return { userId: user.id, supabase }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playlistId, targetFolderId, useAiOrganization } = spotifyImportSchema.parse(body)

    const auth = await resolveSupabaseUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, supabase } = auth
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
          const result = await importSpotifyPlaylist(playlistId, userId, supabase, {
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
