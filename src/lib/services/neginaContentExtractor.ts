import type { Cheerio, CheerioAPI } from 'cheerio'
import type { Element } from 'domhandler'
import type { ChordPosition } from '@/types'
import { buildSpacedChordLine } from '@/utils/chordLineBuilder'

const KNOWN_SECTION_HEADERS = new Set([
  'פתיחה',
  'בית',
  'פזמון',
  'מעבר',
  'סיום',
  'סולו',
  'אינטרו',
  'אאוטרו',
])

interface LyricPart {
  text: string
  isJoin: boolean
  chord?: string
}

interface ParsedRow {
  sectionHeader?: string
  chordPositions: ChordPosition[]
  lyrics: string
}

function normalizeToken(text: string): string {
  return text
    .replace(/\uFEFF/g, '')
    .replace(/\*/g, '')
    .replace(/\s+/g, '')
    .trim()
}

function normalizeLyric(text: string): string {
  return text
    .replace(/\uFEFF/g, '')
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Negina uses `<span class="gutter">` between syllable slots — each gutter is a word boundary.
 */
function extractLyricFromNode($: CheerioAPI, $lyric: Cheerio<Element>): string {
  if (!$lyric.length) return ''

  let result = ''
  $lyric.contents().each((_, node) => {
    if (node.type === 'text') {
      result += (node as { data?: string }).data ?? ''
      return
    }
    if (node.type !== 'tag') return

    const el = node as Element
    const tag = el.tagName?.toLowerCase()
    if (tag === 'h3') return

    const $el = $(el)
    if (tag === 'span' && $el.hasClass('gutter')) {
      result += ' '
    } else {
      result += $el.text()
    }
  })

  return normalizeLyric(result)
}

function isSongTitle(text: string, songTitle?: string): boolean {
  if (!songTitle) return false
  return normalizeLyric(text) === normalizeLyric(songTitle)
}

/** Negina sometimes duplicates a completed phrase in the same join cell for chord alignment. */
function dedupeConsecutivePhrase(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length < 8) return trimmed

  const duplicateMatch = trimmed.match(/^(.+?)\s+\1$/)
  if (duplicateMatch) return duplicateMatch[1].trim()

  return trimmed
}

/**
 * Join cells may contain syllable completion plus repeated lyric tail for chord positioning.
 * e.g. "חדרי חד" + join "רים חדרי חדרים" → keep only "רים".
 */
function trimJoinOverflow(previous: string, joinLyric: string): string {
  const spaceIdx = joinLyric.indexOf(' ')
  if (spaceIdx === -1) return joinLyric

  const syllablePart = joinLyric.slice(0, spaceIdx)
  const rest = joinLyric.slice(spaceIdx + 1).trim()
  if (!rest) return joinLyric

  const completed = normalizeLyric(previous + syllablePart)
  if (rest === completed) return syllablePart

  if (rest.includes(' ') && completed.endsWith(rest) && completed.length > rest.length) {
    return syllablePart
  }

  return joinLyric
}

/**
 * Each Negina `.phrase` cell starts at a specific column in the grid. The chord
 * of a cell sounds at the beginning of that cell's contribution to the lyric:
 * - non-join phrase: position = start of this phrase in the accumulated lyric
 * - join phrase: position = current end of accumulated lyric (the join stitches
 *   directly onto the previous syllable, with no leading space)
 */
function chordPositionForPart(result: string, part: LyricPart): number {
  if (!part.text) return result.length
  if (part.isJoin) return result.length
  return result ? result.length + 1 : 0
}

function deduplicateChordPositions(positions: ChordPosition[]): ChordPosition[] {
  const seen = new Set<number>()
  return positions.map((cp) => {
    let pos = cp.position
    while (seen.has(pos)) pos++
    seen.add(pos)
    return pos === cp.position ? cp : { ...cp, position: pos }
  })
}

function joinRowWithChordPositions(parts: LyricPart[]): {
  lyrics: string
  chordPositions: ChordPosition[]
} {
  let result = ''
  const chordPositions: ChordPosition[] = []

  for (const part of parts) {
    if (part.chord) {
      chordPositions.push({ chord: part.chord, position: chordPositionForPart(result, part) })
    }

    if (!part.text) continue

    if (!result) {
      result = part.text
      continue
    }

    const text = part.isJoin ? trimJoinOverflow(result, part.text) : part.text
    result += part.isJoin ? text : ` ${text}`
  }

  return {
    lyrics: dedupeConsecutivePhrase(normalizeLyric(result)),
    chordPositions: deduplicateChordPositions(chordPositions),
  }
}

function isRedundantLyricRow(current: string, previousLyric?: string): boolean {
  if (!previousLyric || !current) return false
  if (current === previousLyric) return true
  return previousLyric.endsWith(current) && current.length >= 4
}

function parseDataColRow($: CheerioAPI, $row: Cheerio<Element>): ParsedRow {
  const lyricParts: LyricPart[] = []
  let sectionHeader: string | undefined

  $row.find('.phrase').each((_, phraseEl) => {
    const $phrase = $(phraseEl)
    const h3 = normalizeLyric($phrase.find('h3.bold').first().text())
    const chord = normalizeToken($phrase.find('.chord').first().text())
    const lyric = extractLyricFromNode($, $phrase.find('.lyric').first())
    const isJoin = ($phrase.attr('class') ?? '').includes('join')

    if (h3 && KNOWN_SECTION_HEADERS.has(h3)) {
      sectionHeader = h3
      return
    }

    if (h3 && !sectionHeader) {
      sectionHeader = h3
    }

    if (!lyric || lyric === '*') {
      if (chord) {
        lyricParts.push({ text: '', isJoin, chord })
      }
      return
    }

    if (KNOWN_SECTION_HEADERS.has(lyric)) {
      sectionHeader = lyric
      return
    }

    lyricParts.push({ text: lyric, isJoin, ...(chord ? { chord } : {}) })
  })

  const { lyrics, chordPositions } = joinRowWithChordPositions(lyricParts)

  return {
    sectionHeader,
    chordPositions,
    lyrics,
  }
}

function emitSection(
  label: string,
  lines: string[],
  sectionCounts: Map<string, number>
): void {
  const count = (sectionCounts.get(label) ?? 0) + 1
  sectionCounts.set(label, count)
  const display = count > 1 ? `${label} ${count}` : label
  lines.push(`[${display}]`)
}

function flushParsedRow(row: ParsedRow, lines: string[]): void {
  if (row.chordPositions.length > 0 && row.lyrics) {
    lines.push(buildSpacedChordLine(row.chordPositions, row.lyrics))
  }
  if (row.lyrics) {
    lines.push(row.lyrics)
  }
}

/**
 * Negina lays out songs in a multi-column grid. Each lyric/chord line is a
 * `[data-col1]` row containing `.phrase` cells; `join` phrases continue the
 * previous syllable without a space; `gutter` spans mark word boundaries.
 */
export function extractNeginaContent($: CheerioAPI, songTitle?: string): string {
  const lines: string[] = []
  const sectionCounts = new Map<string, number>()

  const wrp = $('.song-text__wrp[data-version="original"]').first()
  const container = wrp.length ? wrp : $('#song-container')
  const rows = container.find('[data-col1]')

  if (!rows.length) {
    return extractNeginaContentLegacy($, songTitle)
  }

  let lastLyricLine: string | undefined

  rows.each((_, rowEl) => {
    const parsed = parseDataColRow($, $(rowEl))

    if (parsed.sectionHeader) {
      if (isSongTitle(parsed.sectionHeader, songTitle)) return
      if (KNOWN_SECTION_HEADERS.has(parsed.sectionHeader)) {
        lastLyricLine = undefined
        emitSection(parsed.sectionHeader, lines, sectionCounts)
        return
      }
    }

    if (!parsed.chordPositions.length && !parsed.lyrics) return
    if (parsed.lyrics && isSongTitle(parsed.lyrics, songTitle)) return

    if (
      parsed.lyrics &&
      !parsed.chordPositions.length &&
      isRedundantLyricRow(parsed.lyrics, lastLyricLine)
    ) {
      return
    }

    flushParsedRow(parsed, lines)
    if (parsed.lyrics) {
      lastLyricLine = parsed.lyrics
    }
  })

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Fallback when Negina markup lacks row wrappers (older pages). */
function extractNeginaContentLegacy($: CheerioAPI, songTitle?: string): string {
  const lines: string[] = []
  const sectionCounts = new Map<string, number>()
  const lyricParts: LyricPart[] = []

  const wrp = $('.song-text__wrp[data-version="original"]').first()
  const container = wrp.length ? wrp : $('#song-container')

  const flush = () => {
    const { lyrics, chordPositions } = joinRowWithChordPositions(lyricParts)
    if (chordPositions.length > 0 && lyrics) {
      lines.push(buildSpacedChordLine(chordPositions, lyrics))
    }
    if (lyrics) lines.push(lyrics)
    lyricParts.length = 0
  }

  container.find('.phrase').each((_, elem) => {
    const $phrase = $(elem)
    const chord = normalizeToken($phrase.find('.chord').first().text())
    const lyric = extractLyricFromNode($, $phrase.find('.lyric').first())
    const h3 = normalizeLyric($phrase.find('h3.bold').first().text())
    const isJoin = ($phrase.attr('class') ?? '').includes('join')
    const isBlank = !lyric || lyric === '*'

    const sectionLabel = h3 || (KNOWN_SECTION_HEADERS.has(lyric) ? lyric : '')

    if (sectionLabel && KNOWN_SECTION_HEADERS.has(sectionLabel) && !isSongTitle(sectionLabel, songTitle)) {
      flush()
      emitSection(sectionLabel, lines, sectionCounts)
      return
    }

    if (isSongTitle(lyric, songTitle) || isSongTitle(h3, songTitle)) return

    if (isBlank) {
      if (chord) lyricParts.push({ text: '', isJoin, chord })
      else flush()
      return
    }

    if (KNOWN_SECTION_HEADERS.has(lyric)) {
      flush()
      emitSection(lyric, lines, sectionCounts)
      return
    }

    if (
      !isJoin &&
      lyricParts.length > 0 &&
      lyricParts.some((p) => p.chord) &&
      !lyricParts[lyricParts.length - 1].isJoin
    ) {
      flush()
    }

    lyricParts.push({ text: lyric, isJoin, ...(chord ? { chord } : {}) })
  })

  flush()

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
