import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { curatedPlaylistService } from '../src/lib/services/curatedPlaylistService'
import { songRepo } from '../src/lib/services/songRepo'
import {
  catalogDedupKey,
  pickCanonicalCatalogSong,
  type CatalogSongRef,
} from '../src/lib/utils/catalogSongDedup'
import { structuredSongToText } from '../src/utils/structuredToText'
import type { Song, SongSection } from '../src/types'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

type SongRow = CatalogSongRef & {
  is_public: boolean
  is_trending: boolean
  genre?: string | null
  decade?: number | null
  difficulty?: string | null
}

type FullSongRow = SongRow & {
  sections: SongSection[] | null
  reviews?: number | null
  capo?: number | null
  key?: string | null
  version?: number | null
  version_description?: string | null
  rating?: number | null
  artist_url?: string | null
  artist_image_url?: string | null
  song_image_url?: string | null
  source_site?: string | null
  bpm?: number | null
}

function mergeCatalogMetadata(
  target: Record<string, unknown>,
  donors: Array<Pick<SongRow, 'genre' | 'decade' | 'difficulty' | 'tab_id' | 'source_url'>>
) {
  if (!target.genre) {
    const genre = donors.find((song) => song.genre)?.genre
    if (genre) target.genre = genre
  }
  if (!target.decade) {
    const decade = donors.find((song) => song.decade)?.decade
    if (decade != null) target.decade = decade
  }
  if (!target.difficulty) {
    const difficulty = donors.find((song) => song.difficulty)?.difficulty
    if (difficulty) target.difficulty = difficulty
  }
  if (!target.tab_id) {
    const tabId = donors.find((song) => song.tab_id)?.tab_id
    if (tabId) target.tab_id = tabId
  }
  if (!target.source_url) {
    const sourceUrl = donors.find((song) => song.source_url)?.source_url
    if (sourceUrl) target.source_url = sourceUrl
  }
}

async function promoteUserSongToSystem(
  supabase: SupabaseClient<Database>,
  donor: FullSongRow
): Promise<string> {
  const sections = (donor.sections || []) as SongSection[]
  const content = structuredSongToText({ sections } as Song)

  const created = await songRepo(supabase).createSystemSong(
    {
      title: donor.title,
      author: donor.author,
      content,
      rating: donor.rating ?? undefined,
      difficulty: donor.difficulty ?? undefined,
      reviews: donor.reviews ?? undefined,
      key: donor.key ?? undefined,
      capo: donor.capo ?? undefined,
      version: donor.version ?? undefined,
      versionDescription: donor.version_description ?? undefined,
      artistUrl: donor.artist_url ?? undefined,
      artistImageUrl: donor.artist_image_url ?? undefined,
      songImageUrl: donor.song_image_url ?? undefined,
      sourceUrl: donor.source_url ?? undefined,
      sourceSite: donor.source_site ?? 'Ultimate Guitar',
      tabId: donor.tab_id ?? undefined,
      bpm: donor.bpm ?? undefined,
    },
    {
      isTrending: donor.is_trending,
      isPublic: true,
      genre: donor.genre ?? undefined,
      decade: donor.decade ?? undefined,
    }
  )

  return created.id
}

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: catalogSongs, error } = await (supabase.from('songs') as any)
    .select(
      'id, title, author, source_url, tab_id, user_id, view_count, created_at, is_public, is_trending, genre, decade, difficulty, sections, reviews, capo, key, version, version_description, rating, artist_url, artist_image_url, song_image_url, source_site, bpm'
    )
    .or('is_public.eq.true,is_trending.eq.true')

  if (error) throw error

  const songs = (catalogSongs || []) as FullSongRow[]
  const groups = new Map<string, FullSongRow[]>()

  for (const song of songs) {
    const key = catalogDedupKey(song)
    const group = groups.get(key) ?? []
    group.push(song)
    groups.set(key, group)
  }

  const duplicateGroups = Array.from(groups.values()).filter((group) => group.length > 1)
  console.log(`Found ${duplicateGroups.length} duplicate catalog groups (${songs.length} catalog rows)`)

  const idRemap = new Map<string, string>()
  let deletedSystem = 0
  let demotedUser = 0
  let promotedToSystem = 0

  for (const group of duplicateGroups) {
    const systemSongs = group.filter((song) => song.user_id == null)
    let canonicalId: string

    if (systemSongs.length > 0) {
      const canonical = pickCanonicalCatalogSong(systemSongs)
      canonicalId = canonical.id

      const patch: Record<string, unknown> = {
        is_public: true,
        is_trending: group.some((song) => song.is_trending),
      }
      mergeCatalogMetadata(patch, group)

      await (supabase.from('songs') as any).update(patch).eq('id', canonicalId)

      for (const song of systemSongs) {
        if (song.id === canonicalId) continue
        await (supabase.from('songs') as any).delete().eq('id', song.id)
        deletedSystem++
        console.log(`  deleted system duplicate: ${song.title} (${song.id.slice(0, 8)})`)
      }
    } else {
      const donor = pickCanonicalCatalogSong(group)
      canonicalId = await promoteUserSongToSystem(supabase, donor)
      promotedToSystem++
      console.log(`  promoted user catalog song to system: ${donor.title} (${canonicalId.slice(0, 8)})`)
    }

    for (const song of group) {
      idRemap.set(song.id, canonicalId)
      if (song.user_id == null && song.id === canonicalId) continue
      if (song.user_id == null) continue

      await (supabase.from('songs') as any)
        .update({ is_public: false, is_trending: false })
        .eq('id', song.id)
      demotedUser++
    }
  }

  const { data: lingeringUserCatalog, error: lingeringError } = await (supabase.from('songs') as any)
    .select('id, title, author, source_url, tab_id')
    .or('is_public.eq.true,is_trending.eq.true')
    .not('user_id', 'is', null)

  if (lingeringError) throw lingeringError

  for (const userSong of lingeringUserCatalog || []) {
    const existing = await songRepo(supabase).findExistingSystemCatalogSong({
      tabId: userSong.tab_id,
      sourceUrl: userSong.source_url,
      title: userSong.title,
      author: userSong.author,
    })

    if (!existing) continue

    idRemap.set(userSong.id, existing.id)
    await (supabase.from('songs') as any)
      .update({ is_public: false, is_trending: false })
      .eq('id', userSong.id)
    demotedUser++
    console.log(`  demoted lingering user catalog song: ${userSong.title}`)
  }

  const { data: playlists, error: playlistsError } = await (supabase.from('playlists') as any)
    .select('id, curated_slug, song_ids')
    .not('curated_slug', 'is', null)

  if (playlistsError) throw playlistsError

  let playlistsUpdated = 0

  for (const playlist of playlists || []) {
    const originalIds = (playlist.song_ids || []) as string[]
    const seen = new Set<string>()
    const nextIds: string[] = []

    for (const id of originalIds) {
      const mapped = idRemap.get(id) ?? id
      if (seen.has(mapped)) continue
      seen.add(mapped)
      nextIds.push(mapped)
    }

    const changed =
      nextIds.length !== originalIds.length || nextIds.some((id, index) => id !== originalIds[index])

    if (changed) {
      await (supabase.from('playlists') as any)
        .update({ song_ids: nextIds, updated_at: new Date().toISOString() })
        .eq('id', playlist.id)
      playlistsUpdated++
      console.log(`  playlist ${playlist.curated_slug}: ${originalIds.length} → ${nextIds.length} songs`)
    }
  }

  console.log('\nRe-seeding curated playlists...')
  const results = await curatedPlaylistService(supabase).seedAllCuratedPlaylists()
  for (const result of results) {
    console.log(`  ${result.slug}: ${result.songCount} songs`)
  }

  console.log('\nDone.')
  console.log(`  System duplicates deleted: ${deletedSystem}`)
  console.log(`  User songs promoted to system: ${promotedToSystem}`)
  console.log(`  User duplicates demoted: ${demotedUser}`)
  console.log(`  Playlists updated: ${playlistsUpdated}`)
}

run().catch((error) => {
  console.error('Cleanup failed:', error)
  process.exit(1)
})
