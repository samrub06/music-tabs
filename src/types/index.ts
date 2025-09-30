// Song is now always structured - no more legacy format
export type Song = StructuredSong;

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChordDiagram {
  name: string;
  guitar?: number[];
  piano?: string[];
}

export interface TransposeOptions {
  semitones: number;
}

export interface AutoScrollOptions {
  speed: number;
  isActive: boolean;
}

export type InstrumentType = 'piano' | 'guitar';

// Position-precise, compact song structure
export interface ChordPosition {
  chord: string;
  position: number; // Exact character position in lyrics
}

export interface SongLine {
  type: 'chords_only' | 'lyrics_only' | 'chord_over_lyrics';
  lyrics?: string; // Lyrics text
  chords?: ChordPosition[]; // Chords with exact positions
  chord_line?: string; // Raw chord line for chords_only type
}

export interface SongSection {
  type: string;
  name: string;
  lines: SongLine[];
}

export interface StructuredSong {
  id: string;
  title: string;
  author: string;
  folderId?: string;
  format: 'structured';
  sections: SongSection[];
  createdAt: Date;
  updatedAt: Date;
}

// Type pour ajouter une nouvelle chanson (avec contenu texte)
export interface NewSongData {
  title: string;
  author: string;
  content: string;
  folderId?: string;
}

export interface AppState {
  songs: Song[];
  folders: Folder[];
  currentSong: Song | null;
  currentFolder: string | null;
  searchQuery: string;
  selectedInstrument: InstrumentType;
  transposeValue: number;
  autoScroll: AutoScrollOptions;
}
