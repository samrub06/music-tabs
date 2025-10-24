'use client';

import { folderService, songService } from '@/lib/services/songService';
import { AppState, Folder, InstrumentType, NewSongData, Song, SongEditData } from '@/types';
import React, { createContext, useContext, useEffect, useReducer } from 'react';

interface AppContextType extends AppState {
  // Actions
  addSong: (songData: NewSongData) => Promise<void>;
  updateSong: (id: string, updates: SongEditData) => Promise<void>;
  updateSongFolder: (id: string, folderId: string | undefined) => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
  deleteSongs: (ids: string[]) => Promise<void>;
  deleteAllSongs: () => Promise<void>;
  addFolder: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  setCurrentFolder: (folderId: string | null) => void;
  setSearchQuery: (query: string) => void;
  searchSongs: (query: string) => Promise<void>;
  setSelectedInstrument: (instrument: InstrumentType) => void;
  setTransposeValue: (value: number) => void;
  setAutoScrollSpeed: (speed: number) => void;
  toggleAutoScroll: () => void;
  importSongs: (songs: Song[]) => Promise<void>;
  exportData: () => string;
  setCurrentSong: (song: Song | null) => void;
}

type AppAction =
  | { type: 'ADD_SONG'; payload: Song }
  | { type: 'UPDATE_SONG'; payload: { id: string; updates: Partial<Song> } }
  | { type: 'DELETE_SONG'; payload: string }
  | { type: 'DELETE_SONGS'; payload: string[] }
  | { type: 'DELETE_ALL_SONGS' }
  | { type: 'ADD_FOLDER'; payload: Folder }
  | { type: 'UPDATE_FOLDER'; payload: { id: string; updates: Partial<Folder> } }
  | { type: 'DELETE_FOLDER'; payload: string }
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
        songs: state.songs.filter(song => song.id !== action.payload)
      };
    
    case 'DELETE_SONGS':
      return {
        ...state,
        songs: state.songs.filter(song => !action.payload.includes(song.id))
      };
    
    case 'DELETE_ALL_SONGS':
      return {
        ...state,
        songs: []
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

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading data from Supabase...');
        const [songs, folders] = await Promise.all([
          songService.getAllSongs(),
          folderService.getAllFolders()
        ]);
        
        console.log('Loaded songs:', songs.length);
        console.log('Loaded folders:', folders);
        
        dispatch({ type: 'LOAD_DATA', payload: { songs, folders } });
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
      }
    };

    loadData();
  }, []);

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const actions: Omit<AppContextType, keyof AppState> = {
    addSong: async (songData) => {
      try {
        const newSong = await songService.createSong(songData);
        dispatch({ type: 'ADD_SONG', payload: newSong });
      } catch (error) {
        console.error('Error adding song:', error);
      }
    },

    updateSong: async (id, updates) => {
      try {
        console.log('Context updateSong called with:', { id, updates });
        const updatedSong = await songService.updateSong(id, updates);
        console.log('Got updated song from service:', updatedSong);
        dispatch({ type: 'UPDATE_SONG', payload: { id, updates: updatedSong } });
        console.log('Dispatched UPDATE_SONG action');
      } catch (error) {
        console.error('Error updating song:', error);
        throw error;
      }
    },

    updateSongFolder: async (id, folderId) => {
      try {
        console.log('Context updateSongFolder called with:', { id, folderId });
        const updatedSong = await songService.updateSongFolder(id, folderId);
        console.log('Got updated song folder from service:', updatedSong);
        dispatch({ type: 'UPDATE_SONG', payload: { id, updates: updatedSong } });
        console.log('Dispatched UPDATE_SONG action for folder change');
      } catch (error) {
        console.error('Error updating song folder:', error);
        throw error;
      }
    },

    deleteSong: async (id) => {
      try {
        await songService.deleteSong(id);
        dispatch({ type: 'DELETE_SONG', payload: id });
      } catch (error) {
        console.error('Error deleting song:', error);
      }
    },

    deleteSongs: async (ids) => {
      try {
        await songService.deleteSongs(ids);
        dispatch({ type: 'DELETE_SONGS', payload: ids });
      } catch (error) {
        console.error('Error deleting songs:', error);
      }
    },

    deleteAllSongs: async () => {
      try {
        await songService.deleteAllSongs();
        dispatch({ type: 'DELETE_ALL_SONGS' });
      } catch (error) {
        console.error('Error deleting all songs:', error);
      }
    },

    addFolder: async (folderData) => {
      try {
        const newFolder = await folderService.createFolder(folderData);
        dispatch({ type: 'ADD_FOLDER', payload: newFolder });
      } catch (error) {
        console.error('Error adding folder:', error);
      }
    },

    updateFolder: async (id, updates) => {
      try {
        const updatedFolder = await folderService.updateFolder(id, updates);
        dispatch({ type: 'UPDATE_FOLDER', payload: { id, updates: updatedFolder } });
      } catch (error) {
        console.error('Error updating folder:', error);
      }
    },

    deleteFolder: async (id) => {
      try {
        await folderService.deleteFolder(id);
        dispatch({ type: 'DELETE_FOLDER', payload: id });
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    },


    setCurrentFolder: (folderId) => {
      dispatch({ type: 'SET_CURRENT_FOLDER', payload: folderId });
    },

    setSearchQuery: (query) => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    },

    searchSongs: async (query) => {
      try {
        const songs = await songService.searchSongs(query);
        // Mettre à jour le state avec les résultats de recherche
        dispatch({ type: 'LOAD_DATA', payload: { songs, folders: state.folders } });
      } catch (error) {
        console.error('Error searching songs:', error);
      }
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

    importSongs: async (songs) => {
      try {
        // Create each song in Supabase
        const createdSongs = await Promise.all(
          songs.map(song => songService.createSong({
            title: song.title,
            author: song.author || '',
            content: song.content,
            folderId: song.folderId
          }))
        );
        // Add all created songs to state
        dispatch({ type: 'IMPORT_SONGS', payload: createdSongs });
      } catch (error) {
        console.error('Error importing songs:', error);
        throw error;
      }
    },

    exportData: () => {
      return JSON.stringify({ songs: state.songs, folders: state.folders }, null, 2);
    },

    setCurrentSong: (songId) => {
      // Implementation for setCurrentSong if needed
      console.log('Setting current song:', songId);
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
