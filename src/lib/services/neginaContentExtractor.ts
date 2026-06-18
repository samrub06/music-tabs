import type { Cheerio, CheerioAPI } from 'cheerio'
import type { Element } from 'domhandler'

/** Map Negina Hebrew section labels → bracket names (UG-compatible). */
const SECTION_HEADER_MAP: Record<string, string> = {
  פתיחה: 'Intro',
  בית: 'Verse',
  פזמון: 'Chorus',
  מעבר: 'Bridge',
  סיום: 'Outro',
  סולו: 'Solo',
  אינטרו: 'Intro',
  אאוטרו: 'Outro',
}

const KNOWN_SECTION_HEADERS = new Set(Object.keys(SECTION_HEADER_MAP))

interface ParsedRow {
  sectionHeader?: string
  chords: string[]
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

function mapSectionHeader(label: string): string {
  return SECTION_HEADER_MAP[label] ?? label
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

  // Multi-word tail that repeats an already-complete phrase (not intentional single-word repeats like "לרצות לרצות").
  if (rest.includes(' ') && completed.endsWith(rest) && completed.length > rest.length) {
    return syllablePart
  }

  return joinLyric
}

function joinRowLyrics(parts: { text: string; isJoin: boolean }[]): string {
  let result = ''

  for (const part of parts) {
    if (!part.text) continue

    if (!result) {
      result = part.text
      continue
    }

    const text = part.isJoin ? trimJoinOverflow(result, part.text) : part.text
    result += part.isJoin ? text : ` ${text}`
  }

  return dedupeConsecutivePhrase(normalizeLyric(result))
}

function isRedundantLyricRow(current: string, previousLyric?: string): boolean {
  if (!previousLyric || !current) return false
  if (current === previousLyric) return true
  return previousLyric.endsWith(current) && current.length >= 4
}

function parseDataColRow($: CheerioAPI, $row: Cheerio<Element>): ParsedRow {
  const chords: string[] = []
  const lyricParts: { text: string; isJoin: boolean }[] = []
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

    if (chord) chords.push(chord)

    if (!lyric || lyric === '*') return

    if (KNOWN_SECTION_HEADERS.has(lyric)) {
      sectionHeader = lyric
      return
    }

    lyricParts.push({ text: lyric, isJoin })
  })

  return {
    sectionHeader,
    chords,
    lyrics: joinRowLyrics(lyricParts),
  }
}

function emitSection(
  label: string,
  lines: string[],
  sectionCounts: Map<string, number>
): void {
  const base = mapSectionHeader(label)
  const count = (sectionCounts.get(base) ?? 0) + 1
  sectionCounts.set(base, count)

  const numberedBases = new Set(['Verse', 'Chorus', 'Bridge', 'Intro', 'Outro'])
  const display =
    count > 1 && numberedBases.has(base)
      ? `${base} ${count}`
      : count === 1 && base === 'Verse'
        ? 'Verse 1'
        : base

  lines.push(`[${display}]`)
}

function flushParsedRow(row: ParsedRow, lines: string[]): void {
  if (row.chords.length > 0) {
    lines.push(row.chords.join(' '))
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

    if (!parsed.chords.length && !parsed.lyrics) return
    if (parsed.lyrics && isSongTitle(parsed.lyrics, songTitle)) return

    if (
      parsed.lyrics &&
      !parsed.chords.length &&
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
  const chords: string[] = []
  const lyricParts: { text: string; isJoin: boolean }[] = []

  const wrp = $('.song-text__wrp[data-version="original"]').first()
  const container = wrp.length ? wrp : $('#song-container')

  const flush = () => {
    const lyrics = joinRowLyrics(lyricParts)
    if (chords.length > 0) lines.push(chords.join(' '))
    if (lyrics) lines.push(lyrics)
    chords.length = 0
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
      if (chord) chords.push(chord)
      else flush()
      return
    }

    if (KNOWN_SECTION_HEADERS.has(lyric)) {
      flush()
      emitSection(lyric, lines, sectionCounts)
      return
    }

    if (!isJoin && lyricParts.length > 0 && chords.length > 0 && !lyricParts[lyricParts.length - 1].isJoin) {
      flush()
    }

    if (chord) chords.push(chord)
    lyricParts.push({ text: lyric, isJoin })
  })

  flush()

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
