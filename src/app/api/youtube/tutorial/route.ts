import { searchFirstEmbeddableTutorial } from '@/lib/services/youtubeService'
import { lyricSyncRepo } from '@/lib/services/lyricSyncRepo'
import { songRepo } from '@/lib/services/songRepo'
import {
  youtubeCacheModeFor,
  youtubeCacheRepo,
} from '@/lib/services/youtubeCacheRepo'
import { createSafeServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { youtubeTutorialSearchSchema } from '@/lib/validation/schemas'
import { lyricSyncLookupSongIds } from '@/utils/lyricSyncLookup'
import type { YoutubeTutorialVideo } from '@/lib/services/youtubeService'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

export const runtime = 'nodejs'

async function resolveLookupSongIds(songId: string): Promise<string[]> {
  try {
    const supabase = await createSafeServerClient()
    const song = await songRepo(supabase).getSong(songId)
    return lyricSyncLookupSongIds(songId, song?.clonedFromId)
  } catch {
    return [songId]
  }
}

async function findCachedOrSyncVideo(input: {
  songId: string
  mode: 'tutorial' | 'original' | 'audio'
  instrument: 'piano' | 'guitar'
}): Promise<YoutubeTutorialVideo | null> {
  const cacheMode = youtubeCacheModeFor(input.mode, input.instrument)
  const lookupIds = await resolveLookupSongIds(input.songId)

  try {
    const supabase = await createSafeServerClient()
    const cache = youtubeCacheRepo(supabase)

    for (const id of lookupIds) {
      const hit = await cache.get(id, cacheMode)
      if (hit?.videoId) return hit
    }

    // Original/audio: reuse ready lyric-sync youtube id (already known for Practice).
    if (cacheMode === 'original') {
      const syncRepo = lyricSyncRepo(supabase)
      for (const id of lookupIds) {
        const ready = await syncRepo.getReadyBySongId(id)
        if (ready?.youtubeVideoId) {
          const video: YoutubeTutorialVideo = {
            videoId: ready.youtubeVideoId,
            title: '',
            channelTitle: '',
          }
          // Persist for next time (service role bypasses RLS write)
          try {
            const service = createServiceRoleClient()
            const persistId = lookupIds[lookupIds.length - 1] ?? input.songId
            await youtubeCacheRepo(service).upsert({
              songId: persistId,
              mode: cacheMode,
              video,
            })
          } catch {
            // ignore cache write failures
          }
          return video
        }
      }
    }
  } catch {
    return null
  }

  return null
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const validated = youtubeTutorialSearchSchema.parse({
      q: searchParams.get('q') ?? '',
      lang: searchParams.get('lang') ?? undefined,
      songId: searchParams.get('songId') ?? undefined,
      mode: searchParams.get('mode') ?? undefined,
      instrument: searchParams.get('instrument') ?? undefined,
    })

    const mode = validated.mode ?? 'tutorial'
    const instrument = validated.instrument ?? 'guitar'

    if (validated.songId) {
      const cached = await findCachedOrSyncVideo({
        songId: validated.songId,
        mode,
        instrument,
      })
      if (cached) {
        return NextResponse.json({ video: cached, cached: true })
      }
    }

    const video = await searchFirstEmbeddableTutorial(
      validated.q,
      validated.lang
    )

    if (!video) {
      return NextResponse.json(
        { error: 'No embeddable tutorial found' },
        { status: 404 }
      )
    }

    if (validated.songId) {
      try {
        const service = createServiceRoleClient()
        const lookupIds = await resolveLookupSongIds(validated.songId)
        // Prefer catalog id so all library links share the same cached video.
        const persistId = lookupIds[lookupIds.length - 1] ?? validated.songId
        await youtubeCacheRepo(service).upsert({
          songId: persistId,
          mode: youtubeCacheModeFor(mode, instrument),
          video,
          query: validated.q,
        })
      } catch (error) {
        console.warn('YouTube cache upsert skipped:', error)
      }
    }

    return NextResponse.json({ video, cached: false })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid search query' }, { status: 400 })
    }

    if (error instanceof Error && error.message === 'YOUTUBE_API_KEY is not configured') {
      return NextResponse.json(
        { error: 'YouTube integration is not configured' },
        { status: 503 }
      )
    }

    console.error('YouTube tutorial search failed:', error)
    return NextResponse.json(
      { error: 'Failed to search YouTube tutorials' },
      { status: 500 }
    )
  }
}
