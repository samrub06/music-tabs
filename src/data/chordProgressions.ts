export type ChordProgressionPreset = {
  id: string
  label: string
  chords: string[]
  nameKey: string
}

export const CHORD_PROGRESSION_PRESETS: ChordProgressionPreset[] = [
  {
    id: 'g-c-d',
    label: 'G · C · D',
    chords: ['G', 'C', 'D'],
    nameKey: 'chords.progressionPopRock',
  },
  {
    id: 'a-e-d',
    label: 'A · E · D',
    chords: ['A', 'E', 'D'],
    nameKey: 'chords.progressionClassicRock',
  },
  {
    id: 'a-e-d-g',
    label: 'A · E · D · G',
    chords: ['A', 'E', 'D', 'G'],
    nameKey: 'chords.progressionFourChordsMajor',
  },
  {
    id: 'c-g-am-f',
    label: 'C · G · Am · F',
    chords: ['C', 'G', 'Am', 'F'],
    nameKey: 'chords.progressionPop',
  },
  {
    id: 'am-f-c-g',
    label: 'Am · F · C · G',
    chords: ['Am', 'F', 'C', 'G'],
    nameKey: 'chords.progressionAxis',
  },
  {
    id: 'em-c-g-d',
    label: 'Em · C · G · D',
    chords: ['Em', 'C', 'G', 'D'],
    nameKey: 'chords.progressionFolk',
  },
  {
    id: 'd-a-bm-g',
    label: 'D · A · Bm · G',
    chords: ['D', 'A', 'Bm', 'G'],
    nameKey: 'chords.progressionBallad',
  },
  {
    id: 'g-d-em-c',
    label: 'G · D · Em · C',
    chords: ['G', 'D', 'Em', 'C'],
    nameKey: 'chords.progressionCampfire',
  },
  {
    id: 'e-b-cshm-a',
    label: 'E · B · C#m · A',
    chords: ['E', 'B', 'C#m', 'A'],
    nameKey: 'chords.progressionPopAlt',
  },
  {
    id: 'f-c-dm-bb',
    label: 'F · C · Dm · Bb',
    chords: ['F', 'C', 'Dm', 'Bb'],
    nameKey: 'chords.progressionPopF',
  },
  {
    id: 'dm-bb-f-c',
    label: 'Dm · Bb · F · C',
    chords: ['Dm', 'Bb', 'F', 'C'],
    nameKey: 'chords.progressionSadPop',
  },
  {
    id: 'c-am-f-g',
    label: 'C · Am · F · G',
    chords: ['C', 'Am', 'F', 'G'],
    nameKey: 'chords.progressionDooWop',
  },
  {
    id: 'g-em-c-d',
    label: 'G · Em · C · D',
    chords: ['G', 'Em', 'C', 'D'],
    nameKey: 'chords.progressionSoftRock',
  },
  {
    id: 'em-g-d-c',
    label: 'Em · G · D · C',
    chords: ['Em', 'G', 'D', 'C'],
    nameKey: 'chords.progressionIndie',
  },
  {
    id: 'am-g-f-e',
    label: 'Am · G · F · E',
    chords: ['Am', 'G', 'F', 'E'],
    nameKey: 'chords.progressionSpanish',
  },
  {
    id: 'd-g-a',
    label: 'D · G · A',
    chords: ['D', 'G', 'A'],
    nameKey: 'chords.progressionCountry',
  },
]

/** Unique chord names appearing in any preset, sorted for dropdowns. */
export function getProgressionFilterChords(
  presets: ChordProgressionPreset[] = CHORD_PROGRESSION_PRESETS
): string[] {
  const names = new Set<string>()
  for (const preset of presets) {
    for (const chord of preset.chords) {
      names.add(chord)
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b))
}

export function filterProgressionsByChord(
  chord: string | null | undefined,
  presets: ChordProgressionPreset[] = CHORD_PROGRESSION_PRESETS
): ChordProgressionPreset[] {
  if (!chord || chord === 'all') return presets
  return presets.filter((preset) => preset.chords.includes(chord))
}
