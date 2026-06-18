/** Strip surrounding brackets from stored section names e.g. "[Verse 1]" → "Verse 1" */
export function stripSectionBrackets(name: string): string {
  const trimmed = name.trim()
  const bracketed = trimmed.match(/^\[(.*)\]$/)
  return bracketed ? bracketed[1].trim() : trimmed
}

type SectionId =
  | 'section'
  | 'content'
  | 'metadata'
  | 'intro'
  | 'outro'
  | 'bridge'
  | 'chorus'
  | 'verse'
  | 'preChorus'
  | 'instrumental'
  | 'solo'
  | 'hook'
  | 'interlude'

const EXACT_SECTION_IDS: Record<string, SectionId> = {
  content: 'content',
  metadata: 'metadata',
  intro: 'intro',
  outro: 'outro',
  bridge: 'bridge',
  chorus: 'chorus',
  refrain: 'chorus',
  couplet: 'verse',
  pont: 'bridge',
  'pre-chorus': 'preChorus',
  'pre chorus': 'preChorus',
  prechorus: 'preChorus',
  instrumental: 'instrumental',
  solo: 'solo',
  hook: 'hook',
  interlude: 'interlude',
}

const ENGLISH_LABELS: Record<SectionId, string> = {
  section: 'Section',
  content: 'Content',
  metadata: 'Metadata',
  intro: 'Intro',
  outro: 'Outro',
  bridge: 'Bridge',
  chorus: 'Chorus',
  verse: 'Verse',
  preChorus: 'Pre-chorus',
  instrumental: 'Instrumental',
  solo: 'Solo',
  hook: 'Hook',
  interlude: 'Interlude',
}

function capitalizeWord(word: string): string {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

function englishSectionLabel(id: SectionId, number?: string): string {
  const label = ENGLISH_LABELS[id]
  return number ? `${label} ${number}` : label
}

function resolveSectionId(raw: string): { id: SectionId; number?: string } | null {
  const normalizedKey = raw.toLowerCase().replace(/\s+/g, ' ').trim()
  const exactId = EXACT_SECTION_IDS[normalizedKey]
  if (exactId) return { id: exactId }

  const numberedMatch = raw.match(/^(verse|chorus|bridge|intro|outro)\s*(\d+)?$/i)
  if (numberedMatch) {
    const id = numberedMatch[1].toLowerCase() as SectionId
    return { id, number: numberedMatch[2] }
  }

  const compactMatch = raw.match(/^(verse|chorus|bridge|intro|outro)(\d+)$/i)
  if (compactMatch) {
    return {
      id: compactMatch[1].toLowerCase() as SectionId,
      number: compactMatch[2],
    }
  }

  return null
}

export type SectionTranslateFn = (key: string) => string

/** Display label without brackets; uses UI locale when `t` is provided. */
export function formatSectionDisplayName(name: string, t?: SectionTranslateFn): string {
  const raw = stripSectionBrackets(name)
  if (!raw) {
    return t?.('songSections.section') ?? ENGLISH_LABELS.section
  }

  const resolved = resolveSectionId(raw)
  if (resolved) {
    const { id, number } = resolved
    if (t) {
      const key = number ? `songSections.${id}Numbered` : `songSections.${id}`
      const translated = t(key)
      if (translated !== key) {
        return number ? translated.replace('{n}', number) : translated
      }
    }
    return englishSectionLabel(id, number)
  }

  return raw
    .split(/\s+/)
    .map((part) => capitalizeWord(part))
    .join(' ')
}
