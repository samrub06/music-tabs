import type { Cheerio, CheerioAPI } from 'cheerio'
import type { Element } from 'domhandler'
import type { ChordPosition } from '@/types'
import { buildSpacedChordLine } from '@/utils/chordLineBuilder'

const CHORD_SPAN_SELECTOR = 'span.c_C'

const SECTION_LABELS = new Set([
  'מעבר:',
  'סיום:',
  'פתיחה:',
  'בית:',
  'פזמון:',
  'אינטרו:',
  'אאוטרו:',
])

interface Tab4uChordToken {
  chord: string
  /** Character index in the chord cell (after nbsp → space). */
  start: number
}

interface Tab4uRowPair {
  chordPositions: ChordPosition[]
  lyrics?: string
  sectionLabel?: string
  chordsOnlyLine?: string
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeCellHtml(html: string): string {
  return html.replace(/&nbsp;/gi, ' ').replace(/<[^>]+>/g, '').replace(/\t/g, '')
}

function wordStartIndices(lyrics: string): number[] {
  const indices: number[] = []
  const re = /\S+/g
  let match: RegExpExecArray | null
  while ((match = re.exec(lyrics)) !== null) {
    indices.push(match.index)
  }
  return indices
}

function nearestWordStart(position: number, wordStarts: number[]): number {
  return wordStarts.reduce((best, candidate) =>
    Math.abs(candidate - position) < Math.abs(best - position) ? candidate : best
  )
}

/**
 * Map Tab4U chord spans to logical lyric positions (0 = phrase start / visual right).
 *
 * Tab4U renders `.chords` as `direction:ltr; text-align:right` above an RTL
 * lyric row; both share a monospace grid but the chord row is tail-padded. A
 * chord's distance from the row's right edge, scaled onto the lyric's OWN
 * occupied width (not the padded row width), lands on the correct word.
 *
 * Using the padded row width `W` as the denominator compresses middle chords
 * ~1 word toward the right (e.g. Db landed on מאושר instead of ולא); dividing
 * by `lyricFieldWidth` (the lyric with trailing padding removed) fixes it.
 * Verified per chord via getBoundingClientRect() on the live pages of
 * halev-sheli (Ishay Ribo & Eyal Golan) and im-eshkachech (Carlebach) — see
 * validate-tab4u-extract.ts pilots.
 */
export function tab4uTokensToLyricPositions(
  tokens: Tab4uChordToken[],
  rawC: string,
  rawL: string,
  lyrics: string
): ChordPosition[] {
  if (tokens.length === 0) return []

  const lyOff = rawL.search(/\S/)
  const W = Math.max(rawC.length, rawL.length)
  const wordStarts = wordStartIndices(lyrics)
  const lyricFieldWidth = rawL.replace(/\s+$/, '').length || W

  const positions = tokens.map((token) => {
    const posFromEnd = W - token.start - token.chord.length - lyOff
    const scaled = (posFromEnd / lyricFieldWidth) * lyrics.length
    const position =
      wordStarts.length === 0
        ? Math.max(0, Math.round(scaled))
        : nearestWordStart(scaled, wordStarts)
    return { chord: token.chord, position }
  })

  // buildSpacedChordLine assumes ascending positions to detect overlaps.
  return positions.sort((a, b) => a.position - b.position)
}

/** @deprecated Use tab4uTokensToLyricPositions — kept for unit tests. */
export function tab4uChordStartsToLyricPositions(tokens: Tab4uChordToken[]): ChordPosition[] {
  if (tokens.length === 0) return []
  const minStart = Math.min(...tokens.map((t) => t.start))
  return tokens.map((t) => ({
    chord: t.chord,
    position: t.start - minStart,
  }))
}

function extractChordTokens($: CheerioAPI, $td: Cheerio<Element>): Tab4uChordToken[] {
  const cellHtml = $td.html() ?? ''
  const tokens: Tab4uChordToken[] = []

  $td.find(CHORD_SPAN_SELECTOR).each((_, spanEl) => {
    const $span = $(spanEl)
    const chord = normalizeWhitespace($span.text())
    if (!chord) return

    const spanHtml = $.html(spanEl)
    const idx = cellHtml.indexOf(spanHtml)
    if (idx === -1) return

    const before = decodeCellHtml(cellHtml.slice(0, idx))

    tokens.push({ chord, start: before.length })
  })

  return tokens
}

function extractLyrics($td: Cheerio<Element>): string {
  return normalizeWhitespace($td.text())
}

function isSectionLabel(text: string): string | undefined {
  const normalized = normalizeWhitespace(text)
  if (!normalized) return undefined
  if (SECTION_LABELS.has(normalized)) return normalized.replace(/:$/, '')
  if (/^מעבר\b/i.test(normalized)) return 'מעבר'
  if (/^סיום\b/i.test(normalized)) return 'סיום'
  return undefined
}

function parseChordRow(
  $: CheerioAPI,
  $td: Cheerio<Element>,
  lyrics?: string,
  rawL?: string
): Tab4uRowPair {
  const tokens = extractChordTokens($, $td)
  const rawC = decodeCellHtml($td.html() ?? '')

  const chordPositions =
    lyrics && rawL
      ? tab4uTokensToLyricPositions(tokens, rawC, rawL, lyrics)
      : tab4uChordStartsToLyricPositions(tokens)

  if (chordPositions.length === 0) {
    const raw = normalizeWhitespace(decodeCellHtml($td.html() ?? ''))
    return { chordPositions: [], chordsOnlyLine: raw || undefined }
  }

  return { chordPositions }
}

function flushPair(pair: Tab4uRowPair, lines: string[]): void {
  if (pair.sectionLabel) {
    lines.push(`[${pair.sectionLabel}]`)
    return
  }

  if (pair.chordPositions.length > 0 && pair.lyrics) {
    lines.push(buildSpacedChordLine(pair.chordPositions, pair.lyrics))
    lines.push(pair.lyrics)
    return
  }

  if (pair.chordsOnlyLine) {
    lines.push(pair.chordsOnlyLine)
    return
  }

  if (pair.chordPositions.length > 0) {
    lines.push(pair.chordPositions.map((c) => c.chord).join(' '))
  } else if (pair.lyrics) {
    lines.push(pair.lyrics)
  }
}

/**
 * Tab4U lays out songs in #songContentTPL as alternating table rows:
 * td.chords (span.c_C) then td.song (Hebrew lyrics), right-aligned for RTL.
 */
export function extractTab4uContent($: CheerioAPI): string {
  const container = $('#songContentTPL')
  if (!container.length) return ''

  const lines: string[] = []
  const rows = container.find('tr')
  let pendingChordRow: { $td: Cheerio<Element> } | null = null

  const flushPending = ($: CheerioAPI) => {
    if (!pendingChordRow) return
    const pair = parseChordRow($, pendingChordRow.$td)
    flushPair(pair, lines)
    pendingChordRow = null
  }

  rows.each((_, rowEl) => {
    const $row = $(rowEl)
    const $td = $row.find('td').first()
    if (!$td.length) return

    const cellClass = ($td.attr('class') ?? '').trim()

    if (cellClass === 'chords') {
      flushPending($)
      pendingChordRow = { $td }
      return
    }

    if (cellClass !== 'song') {
      return
    }

    const lyrics = extractLyrics($td)
    if (!lyrics) {
      flushPending($)
      return
    }

    const sectionLabel = isSectionLabel(lyrics)
    if (sectionLabel) {
      flushPending($)
      lines.push(`[${sectionLabel}]`)
      return
    }

    if (pendingChordRow) {
      const rawL = decodeCellHtml($td.html() ?? '')
      const pair = parseChordRow($, pendingChordRow.$td, lyrics, rawL)
      pair.lyrics = lyrics
      flushPair(pair, lines)
      pendingChordRow = null
      return
    }

    lines.push(lyrics)
  })

  flushPending($)

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
