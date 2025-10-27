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
  content: string;
  reviews?: number;
  capo?: number;
  key?: string;
  soundingKey?: string;
  firstChord?: string;
  lastChord?: string;
  chordProgression?: string[];
  // Nouveaux champs Ultimate Guitar
  version?: number;
  versionDescription?: string;
  rating?: number;
  difficulty?: string;
  artistUrl?: string;
  artistImageUrl?: string;
  songImageUrl?: string;
  sourceUrl?: string;
  sourceSite?: string;
  viewCount?: number;
}

// Type pour ajouter une nouvelle chanson (avec contenu texte)
export interface NewSongData {
  title: string;
  author: string;
  content: string;
  folderId?: string;
  reviews?: number;
  capo?: number;
  key?: string;
  soundingKey?: string;
  firstChord?: string;
  lastChord?: string;
  chordProgression?: string[];
  // Nouveaux champs Ultimate Guitar
  version?: number;
  versionDescription?: string;
  rating?: number;
  difficulty?: string;
  artistUrl?: string;
  artistImageUrl?: string;
  songImageUrl?: string;
  sourceUrl?: string;
  sourceSite?: string;
}

// Type pour l'édition de chanson (avec contenu texte)
export interface SongEditData {
  title: string;
  author: string;
  content: string;
  folderId?: string;
  reviews?: number;
  capo?: number;
  key?: string;
  soundingKey?: string;
  firstChord?: string;
  lastChord?: string;
  chordProgression?: string[];
  // Nouveaux champs Ultimate Guitar
  version?: number;
  versionDescription?: string;
  rating?: number;
  difficulty?: string;
  artistUrl?: string;
  artistImageUrl?: string;
  songImageUrl?: string;
  sourceUrl?: string;
  sourceSite?: string;
}

export interface AppState {
  songs: Song[];
  folders: Folder[];
  playlists: Playlist[];
  currentFolder: string | null;
  currentPlaylistId: string | null;
  searchQuery: string;
  selectedInstrument: InstrumentType;
  transposeValue: number;
  autoScroll: AutoScrollOptions;
}

export interface PlaylistSong {
  title: string;
  artist: string;
  url?: string;
  playlistName?: string;
}

export interface PlaylistData {
  name: string;
  songs: PlaylistSong[];
}

export interface PlaylistImportResult {
  totalPlaylists: number;
  playlists: Array<{
    name: string;
    songCount: number;
    success: number;
    failed: number;
    errors: string[];
  }>;
  summary: {
    totalSongs: number;
    successfulImports: number;
    failedImports: number;
    errors: string[];
  };
}

// Playlists persistent types
export interface PlaylistItemSnapshot {
  id: string; // deprecated
  playlistId: string; // deprecated
  orderIndex: number; // deprecated
  originalSongId?: string; // deprecated
  title: string; // deprecated
  author?: string; // deprecated
  sections: SongSection[]; // deprecated
  key?: string; // deprecated
  capo?: number; // deprecated
  firstChord?: string; // deprecated
  lastChord?: string; // deprecated
  songImageUrl?: string; // deprecated
  createdAt: Date; // deprecated
  updatedAt: Date; // deprecated
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  songIds: string[];
}
