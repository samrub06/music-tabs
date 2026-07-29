import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import type { YoutubeTutorialVideo } from '@/lib/services/youtubeService'
import type { YoutubeVideoMode } from '@/utils/youtubeTutorial'

export type YoutubeCacheMode = 'original' | 'tutorial:guitar' | 'tutorial:piano'

export type SongYoutubeCacheRow = {
  songId: string
  mode: YoutubeCacheMode
  videoId: string
  title: string | null
  channelTitle: string | null
  query: string | null
}

export function youtubeCacheModeFor(
  mode: YoutubeVideoMode,
  instrument: 'piano' | 'guitar'
): YoutubeCacheMode {
  if (mode === 'original' || mode === 'audio') return 'original'
  return instrument === 'piano' ? 'tutorial:piano' : 'tutorial:guitar'
}

export const youtubeCacheRepo = (client: SupabaseClient<Database>) => {
  const table = () => (client as SupabaseClient<any>).from('song_youtube_cache')

  return {
    async get(
      songId: string,
      mode: YoutubeCacheMode
    ): Promise<YoutubeTutorialVideo | null> {
      const { data, error } = await table()
        .select('video_id, title, channel_title')
        .eq('song_id', songId)
        .eq('mode', mode)
        .maybeSingle()

      if (error) {
        // Table may not exist yet in some envs
        if (error.code === 'PGRST205' || error.message?.includes('song_youtube_cache')) {
          return null
        }
        throw error
      }
      if (!data?.video_id) return null

      return {
        videoId: data.video_id as string,
        title: (data.title as string) || '',
        channelTitle: (data.channel_title as string) || '',
      }
    },

    async upsert(input: {
      songId: string
      mode: YoutubeCacheMode
      video: YoutubeTutorialVideo
      query?: string
    }): Promise<void> {
      const { error } = await table().upsert(
        {
          song_id: input.songId,
          mode: input.mode,
          video_id: input.video.videoId,
          title: input.video.title || null,
          channel_title: input.video.channelTitle || null,
          query: input.query ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'song_id,mode' }
      )

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('song_youtube_cache')) {
          return
        }
        throw error
      }
    },
  }
}
