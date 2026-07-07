export interface Tab4uPilotChord {
  chord: string
  position: number
}

export interface Tab4uPilotLine {
  id: string
  lyricsContains: string
  chords: Tab4uPilotChord[]
  /** When several lines share the same lyrics, pick by 0-based index among matches. */
  lineIndex?: number
  /** Optional context for tricky/ambiguous lines (e.g. dense chord clusters). */
  note?: string
}

export interface Tab4uPilotFixture {
  meta: {
    slug: string
    title: string
    author: string
    url: string
    snapshot: string
    note?: string
  }
  lines: Tab4uPilotLine[]
}
