/**
 * Pilot validation for Tab4U category + Negina scrapers (no DB).
 * Usage: npx tsx scripts/validate-scraper-pilot.ts
 *        npx tsx scripts/validate-scraper-pilot.ts --negina-only
 *        npx tsx scripts/validate-scraper-pilot.ts --negina-only --resync-db
 */
import * as dotenv from 'dotenv'
import {
  listNeginaGenreSongs,
  listTab4uCategorySongs,
  scrapeSongFromUrl,
  searchUltimateGuitarOnly,
} from '../src/lib/services/scraperService'
import { parseTextToStructuredSong } from '../src/utils/songParser'
import type { SongLine } from '../src/types'

dotenv.config({ path: '.env.local' })

const HALEV_SHELI_URL =
  'https://negina.co.il/chords/%D7%99%D7%A9%D7%99-%D7%A8%D7%99%D7%91%D7%95/%D7%94%D7%9C%D7%91-%D7%A9%D7%9C%D7%99-1'

function parseStats(title: string, author: string, content: string) {
  const structured = parseTextToStructuredSong(title, author, content)
  const lines = structured.sections.flatMap((s) => s.lines)
  const types = { chords_only: 0, lyrics_only: 0, chord_over_lyrics: 0 }
  for (const l of lines) {
    types[l.type]++
  }
  const fragmented = lines.filter(
    (l) => l.type === 'lyrics_only' && l.lyrics && l.lyrics.trim().length > 0 && l.lyrics.trim().length < 4
  ).length
  return {
    structured,
    sections: structured.sections.map((s) => s.name),
    types,
    fragmented,
    lines,
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

async function validateNeginaHalevSheli(): Promise<void> {
  console.log('\n=== Negina pilot: הלב שלי (ישי ריבו) ===')
  const scraped = await scrapeSongFromUrl(HALEV_SHELI_URL, {
    title: 'הלב שלי',
    author: 'ישי ריבו',
    url: HALEV_SHELI_URL,
    source: 'Negina',
  })

  if (!scraped?.content?.trim()) {
    throw new Error('scrape FAILED (Cloudflare? set SCRAPER_API_KEY / UG_PROXY_URL)')
  }

  console.log(`scrape ok: "${scraped.title}" — ${scraped.content.length} chars`)
  console.log('\nExtracted content (first 16 lines):')
  console.log(scraped.content.split('\n').slice(0, 16).join('\n'))

  const stats = parseStats(scraped.title, scraped.author, scraped.content)
  console.log('\nparse:', {
    sections: stats.sections,
    types: stats.types,
    fragmented: stats.fragmented,
  })

  assert(stats.sections.some((s) => s.includes('בית')), 'expected Hebrew section [בית]')
  assert(stats.types.chord_over_lyrics >= 4, 'expected at least 4 chord_over_lyrics lines')

  const firstVerseLine = stats.lines.find(
    (l): l is SongLine & { type: 'chord_over_lyrics' } =>
      l.type === 'chord_over_lyrics' && (l.lyrics?.includes('הלב שלי נקרע לשנים') ?? false)
  )
  assert(!!firstVerseLine, 'expected first verse line with "הלב שלי נקרע לשנים"')

  const cm = firstVerseLine!.chords?.find((c) => c.chord === 'Cm')
  assert(!!cm, 'expected Cm on first verse line')
  // Negina places chord at the START of the phrase cell (position 0 = beginning of Hebrew reading = right side RTL)
  assert(
    cm!.position === 0,
    `Cm should be at position 0 (start of phrase), got ${cm!.position}`
  )

  const stormLine = stats.lines.find(
    (l): l is SongLine & { type: 'chord_over_lyrics' } =>
      l.type === 'chord_over_lyrics' && (l.lyrics?.includes('כמו סופה מן הים הולם') ?? false)
  )
  assert(!!stormLine, 'expected storm verse line')
  const stormChords = new Set(stormLine!.chords?.map((c) => c.chord) ?? [])
  for (const expected of ['Cm', 'Fm', 'Ab']) {
    assert(stormChords.has(expected), `expected ${expected} on storm line`)
  }

  console.log('\nPilot assertions passed.')
}

async function resyncHalevSheliDb(): Promise<void> {
  console.log('\n=== Resyncing הלב שלי to DB ===')
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const scraped = await scrapeSongFromUrl(HALEV_SHELI_URL, {
    title: 'הלב שלי',
    author: 'ישי ריבו',
    url: HALEV_SHELI_URL,
    source: 'Negina',
  })
  if (!scraped?.content?.trim()) throw new Error('scrape FAILED')

  const structured = parseTextToStructuredSong(
    scraped.title ?? 'הלב שלי',
    scraped.author ?? 'ישי ריבו',
    scraped.content
  )

  const { error } = await (supabase.from('songs') as any)
    .update({
      sections: structured.sections,
      key: structured.firstChord ?? null,
      first_chord: structured.firstChord ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'e71a322c-d2d8-498a-b978-4b2a0c95b784')

  if (error) throw error
  console.log('✅ DB updated. מרפא lines:')
  for (const section of structured.sections) {
    for (const line of section.lines) {
      if (line.lyrics?.includes('מרפא')) {
        console.log('  lyrics:', line.lyrics)
        console.log('  chords:', JSON.stringify(line.chords))
      }
    }
  }
}

async function main() {
  const neginaOnly = process.argv.includes('--negina-only')
  const resyncDb = process.argv.includes('--resync-db')

  if (neginaOnly) {
    await validateNeginaHalevSheli()
    if (resyncDb) await resyncHalevSheliDb()
    return
  }

  await validateNeginaHalevSheli()

  const tab4uPage = await listTab4uCategorySongs({ cat: 1, offset: 0 })
  console.log(`totalResults: ${tab4uPage.totalResults ?? 'unknown'}`)
  console.log(`songs on page: ${tab4uPage.songs.length}`)
  console.log(`nextOffset: ${tab4uPage.nextOffset ?? 'none'}`)
  if (tab4uPage.songs[0]) {
    console.log(`first: ${tab4uPage.songs[0].title} / ${tab4uPage.songs[0].author}`)
    const scraped = await scrapeSongFromUrl(tab4uPage.songs[0].url, tab4uPage.songs[0])
    console.log(
      scraped
        ? `scrape ok: "${scraped.title}" content ${scraped.content.length} chars`
        : 'scrape FAILED'
    )
    if (scraped) {
      const stats = parseStats(scraped.title, scraped.author, scraped.content)
      console.log('parse:', {
        sections: stats.sections,
        types: stats.types,
        fragmented: stats.fragmented,
      })
    }
  }

  console.log('\n=== Negina genre page 1 ===')
  const neginaEntries = await listNeginaGenreSongs(1)
  console.log(`entries with chords: ${neginaEntries.length}`)
  const neginaPick =
    neginaEntries.find((e) => e.title === 'אל תעזבי ידיים') ?? neginaEntries[0]
  if (neginaPick) {
    console.log(`testing: ${neginaPick.title} / ${neginaPick.author}`)
    const scraped = await scrapeSongFromUrl(neginaPick.url, {
      title: neginaPick.title,
      author: neginaPick.author,
      url: neginaPick.url,
      source: 'Negina',
    })
    console.log(
      scraped
        ? `scrape ok: "${scraped.title}" content ${scraped.content.length} chars`
        : 'scrape FAILED (Cloudflare? set SCRAPER_API_KEY)'
    )
    if (scraped) {
      const stats = parseStats(scraped.title, scraped.author, scraped.content)
      console.log('parse:', {
        sections: stats.sections,
        types: stats.types,
        fragmented: stats.fragmented,
      })
      console.log('\nNegina content sample (first 28 lines):')
      console.log(scraped.content.split('\n').slice(0, 28).join('\n'))
    }
  } else {
    console.log('no Negina entries (Cloudflare? set SCRAPER_API_KEY)')
  }

  console.log('\n=== UG reference (Wonderwall) ===')
  const ugResults = await searchUltimateGuitarOnly('wonderwall oasis')
  const ugTab = ugResults.find((r) => r.url.includes('wonderwall-chords-27596')) ?? ugResults[2]
  if (ugTab) {
    const ug = await scrapeSongFromUrl(ugTab.url, ugTab)
    if (ug) {
      console.log(`"${ug.title}" — ${ug.content.length} chars`)
      console.log('parse:', parseStats(ug.title, ug.author, ug.content).types)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
