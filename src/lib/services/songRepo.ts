import type { SupabaseClient } from '@supabase/supabase-js'
import type { NewSongData, Song, SongEditData } from '@/types'
import { parseTextToStructuredSong } from '@/utils/songParser'

export const songRepo = (client: SupabaseClient) => ({
  async createSong(songData: NewSongData): Promise<Song> {
    const { data: { user } } = await client.auth.getUser()

    const structuredSong = parseTextToStructuredSong(
      songData.title,
      songData.author,
      songData.content,
      songData.folderId,
      songData.reviews,
      songData.capo,
      songData.key
    )

    const { data, error } = await client
      .from('songs')
      .insert([{
        user_id: user?.id || null,
        title: songData.title,
        author: songData.author,
        folder_id: songData.folderId,
        format: 'structured',
        sections: structuredSong.sections,
        reviews: songData.reviews ?? 0,
        capo: songData.capo ?? null,
        key: songData.key ?? structuredSong.firstChord,
        first_chord: structuredSong.firstChord ?? null,
        last_chord: structuredSong.lastChord ?? null,
        version: songData.version ?? null,
        version_description: songData.versionDescription ?? null,
        rating: songData.rating ?? null,
        difficulty: songData.difficulty ?? null,
        artist_url: songData.artistUrl ?? null,
        artist_image_url: songData.artistImageUrl ?? null,
        song_image_url: songData.songImageUrl ?? null,
        source_url: songData.sourceUrl ?? null,
        source_site: songData.sourceSite ?? null,
        tab_id: songData.tabId ?? null
      }])
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      ...data,
      folderId: (data as any).folder_id,
      createdAt: new Date((data as any).created_at),
      updatedAt: new Date((data as any).updated_at),
      version: (data as any).version,
      versionDescription: (data as any).version_description,
      rating: (data as any).rating,
      difficulty: (data as any).difficulty,
      artistUrl: (data as any).artist_url,
      artistImageUrl: (data as any).artist_image_url,
      songImageUrl: (data as any).song_image_url,
      sourceUrl: (data as any).source_url,
      sourceSite: (data as any).source_site,
      tabId: (data as any).tab_id
    } as unknown as Song
  },

  async updateSong(id: string, updates: SongEditData): Promise<Song> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to update songs')
    }

    let sections = undefined as any
    if (updates.content) {
      const structuredSong = parseTextToStructuredSong(
        updates.title,
        updates.author,
        updates.content,
        updates.folderId
      )
      sections = structuredSong.sections
    }

    const updateData: any = {
      title: updates.title,
      author: updates.author,
      folder_id: updates.folderId,
      updated_at: new Date().toISOString(),
      version: updates.version ?? null,
      version_description: updates.versionDescription ?? null,
      rating: updates.rating ?? null,
      difficulty: updates.difficulty ?? null,
      artist_url: updates.artistUrl ?? null,
      artist_image_url: updates.artistImageUrl ?? null,
      song_image_url: updates.songImageUrl ?? null,
      source_url: updates.sourceUrl ?? null,
      source_site: updates.sourceSite ?? null,
      tab_id: updates.tabId ?? null
    }
    if (sections) {
      updateData.sections = sections
    }

    const { data, error } = await client
      .from('songs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      ...data,
      folderId: (data as any).folder_id,
      createdAt: new Date((data as any).created_at),
      updatedAt: new Date((data as any).updated_at),
      version: (data as any).version,
      versionDescription: (data as any).version_description,
      rating: (data as any).rating,
      difficulty: (data as any).difficulty,
      artistUrl: (data as any).artist_url,
      artistImageUrl: (data as any).artist_image_url,
      songImageUrl: (data as any).song_image_url,
      sourceUrl: (data as any).source_url,
      sourceSite: (data as any).source_site,
      tabId: (data as any).tab_id
    } as unknown as Song
  },

  async updateSongFolder(id: string, folderId?: string): Promise<Song> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to update songs')
    }

    const { data, error } = await client
      .from('songs')
      .update({
        folder_id: folderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      ...data,
      folderId: (data as any).folder_id,
      createdAt: new Date((data as any).created_at),
      updatedAt: new Date((data as any).updated_at),
      version: (data as any).version,
      versionDescription: (data as any).version_description,
      rating: (data as any).rating,
      difficulty: (data as any).difficulty,
      artistUrl: (data as any).artist_url,
      artistImageUrl: (data as any).artist_image_url,
      songImageUrl: (data as any).song_image_url,
      sourceUrl: (data as any).source_url,
      sourceSite: (data as any).source_site
    } as unknown as Song
  },

  async deleteSong(id: string): Promise<void> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to delete songs')
    }

    const { error } = await client.from('songs').delete().eq('id', id)
    if (error) {
      throw error
    }
  },

  async deleteSongs(ids: string[]): Promise<void> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to delete songs')
    }
    if (ids.length === 0) return
    const { error } = await client.from('songs').delete().in('id', ids)
    if (error) {
      throw error
    }
  },

  async deleteAllSongs(): Promise<void> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to delete songs')
    }
    const { error } = await client.from('songs').delete().eq('user_id', user.id)
    if (error) {
      throw error
    }
  }
})


