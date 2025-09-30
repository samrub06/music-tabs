'use client';

// Backend API will provide data
import { AppState, Folder, InstrumentType, Song, NewSongData } from '@/types';
import React, { createContext, useContext, useEffect, useReducer } from 'react';

interface AppContextType extends AppState {
  // Actions
  addSong: (songData: NewSongData) => Promise<void>;
  updateSong: (id: string, updates: Partial<Song>) => void;
  deleteSong: (id: string) => void;
  addFolder: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  setCurrentSong: (song: Song | null) => void;
  setCurrentFolder: (folderId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedInstrument: (instrument: InstrumentType) => void;
  setTransposeValue: (value: number) => void;
  setAutoScrollSpeed: (speed: number) => void;
  toggleAutoScroll: () => void;
  importSongs: (songs: Song[]) => void;
  exportData: () => string;
}

type AppAction =
  | { type: 'ADD_SONG'; payload: Song }
  | { type: 'UPDATE_SONG'; payload: { id: string; updates: Partial<Song> } }
  | { type: 'DELETE_SONG'; payload: string }
  | { type: 'ADD_FOLDER'; payload: Folder }
  | { type: 'UPDATE_FOLDER'; payload: { id: string; updates: Partial<Folder> } }
  | { type: 'DELETE_FOLDER'; payload: string }
  | { type: 'SET_CURRENT_SONG'; payload: Song | null }
  | { type: 'SET_CURRENT_FOLDER'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_INSTRUMENT'; payload: InstrumentType }
  | { type: 'SET_TRANSPOSE_VALUE'; payload: number }
  | { type: 'SET_AUTO_SCROLL_SPEED'; payload: number }
  | { type: 'TOGGLE_AUTO_SCROLL' }
  | { type: 'IMPORT_SONGS'; payload: Song[] }
  | { type: 'LOAD_DATA'; payload: { songs: Song[]; folders: Folder[] } };

const initialState: AppState = {
  songs: [],
  folders: [],
  currentSong: null,
  currentFolder: null,
  searchQuery: '',
  selectedInstrument: 'piano',
  transposeValue: 0,
  autoScroll: {
    speed: 2.5,
    isActive: false
  }
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_SONG':
      return {
        ...state,
        songs: [...state.songs, action.payload]
      };
    
    case 'UPDATE_SONG':
      return {
        ...state,
        songs: state.songs.map(song =>
          song.id === action.payload.id
            ? { ...song, ...action.payload.updates, updatedAt: new Date() }
            : song
        )
      };
    
    case 'DELETE_SONG':
      return {
        ...state,
        songs: state.songs.filter(song => song.id !== action.payload),
        currentSong: state.currentSong?.id === action.payload ? null : state.currentSong
      };
    
    case 'ADD_FOLDER':
      return {
        ...state,
        folders: [...state.folders, action.payload]
      };
    
    case 'UPDATE_FOLDER':
      return {
        ...state,
        folders: state.folders.map(folder =>
          folder.id === action.payload.id
            ? { ...folder, ...action.payload.updates, updatedAt: new Date() }
            : folder
        )
      };
    
    case 'DELETE_FOLDER':
      return {
        ...state,
        folders: state.folders.filter(folder => folder.id !== action.payload),
        songs: state.songs.map(song =>
          song.folderId === action.payload
            ? { ...song, folderId: undefined }
            : song
        ),
        currentFolder: state.currentFolder === action.payload ? null : state.currentFolder
      };
    
    case 'SET_CURRENT_SONG':
      return { ...state, currentSong: action.payload };
    
    case 'SET_CURRENT_FOLDER':
      return { ...state, currentFolder: action.payload };
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    
    case 'SET_SELECTED_INSTRUMENT':
      return { ...state, selectedInstrument: action.payload };
    
    case 'SET_TRANSPOSE_VALUE':
      return { ...state, transposeValue: action.payload };
    
    case 'SET_AUTO_SCROLL_SPEED':
      return {
        ...state,
        autoScroll: { ...state.autoScroll, speed: action.payload }
      };
    
    case 'TOGGLE_AUTO_SCROLL':
      return {
        ...state,
        autoScroll: { ...state.autoScroll, isActive: !state.autoScroll.isActive }
      };
    
    case 'IMPORT_SONGS':
      return {
        ...state,
        songs: [...state.songs, ...action.payload]
      };
    
    case 'LOAD_DATA':
      return {
        ...state,
        songs: action.payload.songs.map(song => ({
          ...song,
          createdAt: new Date(song.createdAt),
          updatedAt: new Date(song.updatedAt)
        })),
        folders: action.payload.folders.map(folder => ({
          ...folder,
          createdAt: new Date(folder.createdAt),
          updatedAt: new Date(folder.updatedAt)
        }))
      };
    
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from backend API
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/songs');
        if (response.ok) {
          const data = await response.json();
          dispatch({ type: 'LOAD_DATA', payload: data });
        } else {
          console.error('Failed to load data from API');
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const actions: Omit<AppContextType, keyof AppState> = {
    addSong: async (songData) => {
      try {
        const response = await fetch('/api/songs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(songData),
        });

        if (response.ok) {
          const newSong = await response.json();
          dispatch({ type: 'ADD_SONG', payload: newSong });
        } else {
          console.error('Failed to add song');
        }
      } catch (error) {
        console.error('Error adding song:', error);
      }
    },

    updateSong: (id, updates) => {
      dispatch({ type: 'UPDATE_SONG', payload: { id, updates } });
    },

    deleteSong: (id) => {
      dispatch({ type: 'DELETE_SONG', payload: id });
    },

    addFolder: async (folderData) => {
      try {
        const response = await fetch('/api/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(folderData),
        });

        if (response.ok) {
          const newFolder = await response.json();
          dispatch({ type: 'ADD_FOLDER', payload: newFolder });
        } else {
          console.error('Failed to add folder');
        }
      } catch (error) {
        console.error('Error adding folder:', error);
      }
    },

    updateFolder: (id, updates) => {
      dispatch({ type: 'UPDATE_FOLDER', payload: { id, updates } });
    },

    deleteFolder: (id) => {
      dispatch({ type: 'DELETE_FOLDER', payload: id });
    },

    setCurrentSong: (song) => {
      dispatch({ type: 'SET_CURRENT_SONG', payload: song });
    },

    setCurrentFolder: (folderId) => {
      dispatch({ type: 'SET_CURRENT_FOLDER', payload: folderId });
    },

    setSearchQuery: (query) => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    },

    setSelectedInstrument: (instrument) => {
      dispatch({ type: 'SET_SELECTED_INSTRUMENT', payload: instrument });
    },

    setTransposeValue: (value) => {
      dispatch({ type: 'SET_TRANSPOSE_VALUE', payload: value });
    },

    setAutoScrollSpeed: (speed) => {
      dispatch({ type: 'SET_AUTO_SCROLL_SPEED', payload: speed });
    },

    toggleAutoScroll: () => {
      dispatch({ type: 'TOGGLE_AUTO_SCROLL' });
    },

    importSongs: (songs) => {
      const songsWithIds = songs.map(song => ({
        ...song,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      dispatch({ type: 'IMPORT_SONGS', payload: songsWithIds });
    },

    exportData: () => {
      return JSON.stringify({ songs: state.songs, folders: state.folders }, null, 2);
    }
  };

  return (
    <AppContext.Provider value={{ ...state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
