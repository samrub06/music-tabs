/**
 * Pilot validation for Tab4U category + Negina scrapers (no DB).
 * Usage: npx tsx scripts/validate-scraper-pilot.ts
 */
import * as dotenv from 'dotenv'
import {
  listNeginaGenreSongs,
  listTab4uCategorySongs,
  scrapeSongFromUrl,
  searchUltimateGuitarOnly,
} from '../src/lib/services/scraperService'
import { parseTextToStructuredSong } from '../src/utils/songParser'

dotenv.config({ path: '.env.local' })

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
    sections: structured.sections.map((s) => s.name),
    types,
    fragmented,
  }
}

async function main() {
  console.log('=== Tab4U cat=1 page 1 ===')
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
      console.log('images:', {
        artist: scraped.artistImageUrl ?? '(none)',
        song: scraped.songImageUrl ?? '(none)',
      })
      console.log('parse:', parseStats(scraped.title, scraped.author, scraped.content))
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
      console.log('parse:', stats)
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
      console.log('parse:', parseStats(ug.title, ug.author, ug.content))
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
