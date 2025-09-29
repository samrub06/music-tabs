export interface Song {
  id: string;
  title: string;
  author: string;
  content: string;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
