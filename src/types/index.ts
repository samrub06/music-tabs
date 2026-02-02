// Song is now always structured - no more legacy format
export type Song = StructuredSong;

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  displayOrder?: number;
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
  tabId?: string;
  genre?: string;
  decade?: number;
  bpm?: number;
  allChords?: string[];
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
  tabId?: string;
  genre?: string;
  bpm?: number;
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
  tabId?: string;
  genre?: string;
  bpm?: number;
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

export interface ChordData {
  chord: [number, number | 'x' | 0][];
  position: number;
  barres: { fromString: number; toString: number; fret: number }[];
}

export interface Chord {
  id: string;
  name: string;
  chordData: ChordData;
  section: string;
  tuning: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
  learningOrder?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// GAMIFICATION TYPES
// =============================================

export interface UserStats {
  userId: string;
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  totalSongsCreated: number;
  totalSongsViewed: number;
  totalFoldersCreated: number;
  totalPlaylistsCreated: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface XpTransaction {
  id: string;
  userId: string;
  xpAmount: number;
  actionType: 'create_song' | 'view_song' | 'create_folder' | 'create_playlist' | 'edit_song' | 'clone_song' | 'daily_login';
  entityId: string | null;
  createdAt: Date;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeType: 'milestone' | 'achievement';
  badgeKey: string;
  badgeName: string;
  badgeDescription: string | null;
  earnedAt: Date;
}

export interface BadgeDefinition {
  key: string;
  type: 'milestone' | 'achievement';
  name: string;
  description: string;
  icon?: string;
  checkCondition: (stats: UserStats) => boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  badges: UserBadge[];
}

export interface XpAwardResult {
  totalXp: number;
  currentLevel: number;
  levelUp: boolean;
  oldLevel: number;
  newLevel: number;
}

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  streakIncremented: boolean;
  dailyBonusAwarded: boolean;
}
