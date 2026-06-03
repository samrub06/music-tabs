/** Strip surrounding brackets from stored section names e.g. "[Verse 1]" → "Verse 1" */
export function stripSectionBrackets(name: string): string {
  const trimmed = name.trim()
  const bracketed = trimmed.match(/^\[(.*)\]$/)
  return bracketed ? bracketed[1].trim() : trimmed
}

const EXACT_ENGLISH: Record<string, string> = {
  content: 'Content',
  metadata: 'Metadata',
  intro: 'Intro',
  outro: 'Outro',
  bridge: 'Bridge',
  chorus: 'Chorus',
  refrain: 'Chorus',
  couplet: 'Verse',
  pont: 'Bridge',
  'pre-chorus': 'Pre-chorus',
  'pre chorus': 'Pre-chorus',
  prechorus: 'Pre-chorus',
  instrumental: 'Instrumental',
  solo: 'Solo',
  hook: 'Hook',
  interlude: 'Interlude',
}

function capitalizeWord(word: string): string {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

/** Display label in English without brackets, e.g. "Verse1" → "Verse 1" */
export function formatSectionDisplayName(name: string): string {
  const raw = stripSectionBrackets(name)
  if (!raw) return 'Section'

  const normalizedKey = raw.toLowerCase().replace(/\s+/g, ' ').trim()
  if (EXACT_ENGLISH[normalizedKey]) {
    return EXACT_ENGLISH[normalizedKey]
  }

  const verseMatch = raw.match(/^verse\s*(\d+)?$/i)
  if (verseMatch) {
    return verseMatch[1] ? `Verse ${verseMatch[1]}` : 'Verse'
  }

  const chorusMatch = raw.match(/^chorus\s*(\d+)?$/i)
  if (chorusMatch) {
    return chorusMatch[1] ? `Chorus ${chorusMatch[1]}` : 'Chorus'
  }

  const bridgeMatch = raw.match(/^bridge\s*(\d+)?$/i)
  if (bridgeMatch) {
    return bridgeMatch[1] ? `Bridge ${bridgeMatch[1]}` : 'Bridge'
  }

  const introMatch = raw.match(/^intro\s*(\d+)?$/i)
  if (introMatch) {
    return introMatch[1] ? `Intro ${introMatch[1]}` : 'Intro'
  }

  // Verse1, Chorus2, Bridge1 (no space)
  const compactMatch = raw.match(/^(verse|chorus|bridge|intro|outro)(\d+)$/i)
  if (compactMatch) {
    const label = capitalizeWord(compactMatch[1])
    return `${label} ${compactMatch[2]}`
  }

  return raw
    .split(/\s+/)
    .map((part) => capitalizeWord(part))
    .join(' ')
}
