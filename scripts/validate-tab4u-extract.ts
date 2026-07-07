/**
 * Pilot validation for Tab4U extractor (line-by-line chord positions).
 *
 * Usage:
 *   npm run validate:tab4u-extract
 *   npx tsx scripts/validate-tab4u-extract.ts --song=halev-sheli
 *   npx tsx scripts/validate-tab4u-extract.ts --song=halev-sheli --line=storm
 *   npx tsx scripts/validate-tab4u-extract.ts --song=halev-sheli --live
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as cheerio from 'cheerio'
import halevSheli from '../src/data/extracted/tab4u/halev-sheli.pilot.json'
import halevSheliEyalGolan from '../src/data/extracted/tab4u/halev-sheli-eyal-golan.pilot.json'
import imEshkachech from '../src/data/extracted/tab4u/im-eshkachech.pilot.json'
import type { Tab4uPilotFixture, Tab4uPilotLine } from '../src/data/extracted/tab4u/types'
import { extractTab4uContent } from '../src/lib/services/tab4uContentExtractor'
import { scrapeSongFromUrl } from '../src/lib/services/scraperService'
import { parseTextToStructuredSong } from '../src/utils/songParser'
import type { ChordPosition, SongLine } from '../src/types'

const FIXTURES: Record<string, Tab4uPilotFixture> = {
  'halev-sheli': halevSheli as Tab4uPilotFixture,
  'halev-sheli-eyal-golan': halevSheliEyalGolan as Tab4uPilotFixture,
  'im-eshkachech': imEshkachech as Tab4uPilotFixture,
}

const SNAPSHOT_DIR = path.join(process.cwd(), 'src/data/extracted/tab4u')

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit?.slice(prefix.length)
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function chordsEqual(actual: ChordPosition[], expected: Tab4uPilotLine['chords']): boolean {
  if (actual.length !== expected.length) return false
  return actual.every(
    (c, i) => c.chord === expected[i].chord && c.position === expected[i].position
  )
}

function formatChords(chords: ChordPosition[] | undefined): string {
  return (chords ?? []).map((c) => `${c.chord}@${c.position}`).join(', ') || '(none)'
}

function findChordLine(
  lines: SongLine[],
  spec: Tab4uPilotLine
): (SongLine & { type: 'chord_over_lyrics' }) | undefined {
  const matches = lines.filter(
    (l): l is SongLine & { type: 'chord_over_lyrics' } =>
      l.type === 'chord_over_lyrics' && (l.lyrics?.includes(spec.lyricsContains) ?? false)
  )
  const index = spec.lineIndex ?? 0
  return matches[index]
}

async function loadContent(fixture: Tab4uPilotFixture): Promise<string> {
  if (hasFlag('live')) {
    const scraped = await scrapeSongFromUrl(fixture.meta.url, {
      title: fixture.meta.title,
      author: fixture.meta.author,
      url: fixture.meta.url,
      source: 'Tab4U',
    })
    if (!scraped?.content?.trim()) {
      throw new Error(`live scrape failed for ${fixture.meta.url}`)
    }
    return scraped.content
  }

  const snapshotPath = path.join(SNAPSHOT_DIR, fixture.meta.snapshot)
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`snapshot missing: ${snapshotPath} (use --live or add HTML snapshot)`)
  }
  const html = fs.readFileSync(snapshotPath, 'utf8')
  return extractTab4uContent(cheerio.load(html))
}

function validateLine(
  structuredLines: SongLine[],
  spec: Tab4uPilotLine,
  verbose: boolean
): void {
  const line = findChordLine(structuredLines, spec)
  assert(!!line, `[${spec.id}] no chord_over_lyrics line matching "${spec.lyricsContains}"`)

  const actual = line!.chords ?? []
  if (!chordsEqual(actual, spec.chords)) {
    if (verbose) {
      console.error(`\n[${spec.id}] ${spec.lyricsContains}`)
      console.error(`  expected: ${formatChords(spec.chords)}`)
      console.error(`  got:      ${formatChords(actual)}`)
    }
    throw new Error(
      `[${spec.id}] chord mismatch — expected ${formatChords(spec.chords)}, got ${formatChords(actual)}`
    )
  }

  console.log(`  ✓ ${spec.id}: ${formatChords(actual)}`)
}

async function validateFixture(fixture: Tab4uPilotFixture): Promise<void> {
  const lineFilter = getArg('line')
  const verbose = hasFlag('verbose')
  const specs = lineFilter
    ? fixture.lines.filter((l) => l.id === lineFilter)
    : fixture.lines

  if (lineFilter && specs.length === 0) {
    throw new Error(`unknown line id "${lineFilter}" for song ${fixture.meta.slug}`)
  }

  console.log(`\n=== Tab4U pilot: ${fixture.meta.title} (${fixture.meta.author}) ===`)
  console.log(`source: ${hasFlag('live') ? 'live' : `snapshot ${fixture.meta.snapshot}`}`)

  const content = await loadContent(fixture)
  if (verbose) {
    console.log('\nExtracted content (first 16 lines):')
    console.log(content.split('\n').slice(0, 16).join('\n'))
  }

  const structured = parseTextToStructuredSong(
    fixture.meta.title,
    fixture.meta.author,
    content
  )
  const lines = structured.sections.flatMap((s) => s.lines)

  for (const spec of specs) {
    validateLine(lines, spec, verbose)
  }

  console.log(`\n${specs.length} line assertion(s) passed.`)
}

async function main(): Promise<void> {
  const songSlug = getArg('song')
  const slugs = songSlug ? [songSlug] : Object.keys(FIXTURES)

  for (const slug of slugs) {
    const fixture = FIXTURES[slug]
    if (!fixture) {
      throw new Error(`unknown song "${slug}". Available: ${Object.keys(FIXTURES).join(', ')}`)
    }
    await validateFixture(fixture)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
