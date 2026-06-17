import partA from '@/data/extracted/jewishChordBook/part-a.pilot.json'
import partB from '@/data/extracted/jewishChordBook/part-b.pilot.json'
import { toNewSongData } from '@/data/extracted/jewishChordBook/types'
import { jewishChordBookExtractSchema } from '@/lib/validation/schemas'
import { parseTextToStructuredSong } from '@/utils/songParser'

const PART_FILES = {
  a: partA,
  b: partB,
} as const

function parsePartArg(): keyof typeof PART_FILES {
  const partFlag = process.argv.find((arg) => arg.startsWith('--part='))
  const part = partFlag?.split('=')[1]?.toLowerCase() ?? 'a'
  if (part !== 'a' && part !== 'b') {
    console.error(`Unknown part "${part}". Use --part=a or --part=b`)
    process.exit(1)
  }
  return part
}

const part = parsePartArg()
const validated = jewishChordBookExtractSchema.parse(PART_FILES[part])

console.log(`Validating ${validated.songs.length} songs from Jewish Chord Book ${validated.meta.part}...\n`)

let failed = 0

for (const song of validated.songs) {
  const payload = toNewSongData(song)
  const structured = parseTextToStructuredSong(
    payload.title,
    payload.author,
    payload.content,
    undefined,
    undefined,
    payload.capo,
    payload.key
  )

  const sectionCount = structured.sections.length
  const lineCount = structured.sections.reduce((n, s) => n + s.lines.length, 0)
  const ok = sectionCount > 0 && lineCount > 0

  const icon = ok ? '✓' : '✗'
  console.log(
    `${icon} p.${song.source.page} ${song.slug} — ${sectionCount} sections, ${lineCount} lines, key=${structured.key}, firstChord=${structured.firstChord ?? 'n/a'}`
  )

  if (!ok) failed++
}

console.log(failed === 0 ? '\nAll songs parsed successfully.' : `\n${failed} song(s) failed parsing.`)
process.exit(failed > 0 ? 1 : 0)
