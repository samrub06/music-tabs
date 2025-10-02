'use client';

import { useApp } from '@/context/AppContext';
import { Song } from '@/types';
import {
    ChevronDownIcon,
    ChevronUpIcon,
    FunnelIcon,
    MusicalNoteIcon,
    PencilIcon,
    PlayIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import EditSongForm from './EditSongForm';

type SortField = 'title' | 'author' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export default function SongTable() {
  const { 
    songs, 
    folders,
    searchQuery, 
    deleteSong,
    currentFolder,
    setCurrentFolder
  } = useApp();
  const router = useRouter();
  
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFolderFilter, setShowFolderFilter] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFolderFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter songs based on search query and folder
  const filteredSongs = useMemo(() => {
    let filtered = songs;

    // Filter by folder
    if (currentFolder === 'unorganized') {
      filtered = songs.filter(song => !song.folderId);
    } else if (currentFolder) {
      filtered = songs.filter(song => song.folderId === currentFolder);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(song => 
        song.title.toLowerCase().includes(query) ||
        song.author.toLowerCase().includes(query) ||
        // Search in all sections and lines for structured songs
        song.sections?.some(section => 
          section.name.toLowerCase().includes(query) ||
          section.lines.some(line => 
            line.lyrics?.toLowerCase().includes(query) ||
            line.chords?.some(chord => chord.chord.toLowerCase().includes(query))
          )
        )
      );
    }

    return filtered;
  }, [songs, searchQuery, currentFolder]);

  // Sort songs
  const sortedSongs = useMemo(() => {
    return [...filteredSongs].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'author':
          aValue = a.author.toLowerCase();
          bValue = b.author.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSongs, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFolderName = (folderId: string | null | undefined) => {
    if (!folderId) return 'Sans dossier';
    console.log('Looking for folder with ID:', folderId);
    console.log('Available folders:', folders);
    const folder = folders.find(f => f.id === folderId);
    console.log('Found folder:', folder);
    return folder ? folder.name : 'Dossier inconnu';
  };

  const handleDeleteSong = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer cette chanson ?')) {
      deleteSong(songId);
    }
  };

  const handleEditSong = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    setSelectedSong(song);
    setShowEditForm(true);
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setSelectedSong(null);
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left font-medium text-gray-900 hover:text-gray-700 focus:outline-none"
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? 
          <ChevronUpIcon className="h-4 w-4" /> : 
          <ChevronDownIcon className="h-4 w-4" />
      )}
    </button>
  );

  if (sortedSongs.length === 0) {
    return (
      <div className="text-center py-12">
        <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {searchQuery ? 'Aucune chanson trouvée' : 'Aucune chanson'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchQuery ? 'Essayez de modifier votre recherche.' : 'Commencez par ajouter une chanson.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      {/* Filter Bar */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {sortedSongs.length} chanson{sortedSongs.length !== 1 ? 's' : ''}
            </span>
            {currentFolder && (
              <span className="text-sm text-gray-500">
                dans {getFolderName(currentFolder)}
              </span>
            )}
          </div>
          
          {/* Folder Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowFolderFilter(!showFolderFilter)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {currentFolder === null ? 'Tous les dossiers' : 
               currentFolder === 'unorganized' ? 'Sans dossier' : 
               getFolderName(currentFolder)}
              <ChevronDownIcon className="h-4 w-4 ml-2" />
            </button>

            {showFolderFilter && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setCurrentFolder(null);
                      setShowFolderFilter(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      currentFolder === null
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Toutes les chansons
                  </button>
                  <button
                    onClick={() => {
                      setCurrentFolder('unorganized');
                      setShowFolderFilter(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      currentFolder === 'unorganized'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Sans dossier
                  </button>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setCurrentFolder(folder.id);
                        setShowFolderFilter(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        currentFolder === folder.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {folder.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="title">Titre</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="author">Artiste</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dossier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="updatedAt">Modifié</SortButton>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedSongs.map((song) => (
              <tr
                key={song.id}
                onClick={() => router.push(`/song/${song.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <MusicalNoteIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {song.title}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 truncate max-w-xs">
                    {song.author}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {getFolderName(song.folderId)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(song.updatedAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/song/${song.id}`);
                      }}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      title="Ouvrir"
                    >
                      <PlayIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleEditSong(e, song)}
                      className="text-green-600 hover:text-green-900 p-1 rounded"
                      title="Modifier"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSong(e, song.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded"
                      title="Supprimer"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Song Modal */}
      <EditSongForm 
        isOpen={showEditForm}
        onClose={handleCloseEditForm}
        song={selectedSong}
      />
    </div>
  );
}
