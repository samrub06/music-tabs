'use client';

import { useApp } from '@/context/AppContext';
import { Song } from '@/types';
import {
    FolderIcon,
    MusicalNoteIcon,
    PlayIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';

export default function SongList() {
  const { 
    songs, 
    folders,
    currentFolder, 
    searchQuery, 
    deleteSong
  } = useApp();
  const router = useRouter();

  // Filter songs based on current folder and search query
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

    // Sort by title
    return filtered.sort((a, b) => a.title.localeCompare(b.title));
  }, [songs, currentFolder, searchQuery]);

  const handleDeleteSong = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer cette chanson ?')) {
      deleteSong(songId);
    }
  };

  const getFolderName = (folderId?: string) => {
    if (!folderId) return null;
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || 'Dossier inconnu';
  };

  const getCurrentFolderName = () => {
    if (currentFolder === 'unorganized') return 'Sans dossier';
    if (currentFolder) {
      return getFolderName(currentFolder) || 'Dossier';
    }
    return 'Toutes les chansons';
  };

  if (filteredSongs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchQuery ? 'Aucune chanson trouvée' : 'Aucune chanson'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? `Aucune chanson ne correspond à &quot;${searchQuery}&quot;`
              : 'Commencez par ajouter votre première chanson.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {getCurrentFolderName()}
          </h2>
          <span className="text-sm text-gray-500">
            {filteredSongs.length} chanson{filteredSongs.length > 1 ? 's' : ''}
          </span>
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600 mt-1">
            Résultats pour &quot;{searchQuery}&quot;
          </p>
        )}
      </div>

      {/* Song List */}
      <div className="divide-y divide-gray-200">
        {filteredSongs.map((song) => (
          <SongListItem
            key={song.id}
            song={song}
            folderName={getFolderName(song.folderId)}
            onPlay={() => router.push(`/song/${song.id}`)}
            onDelete={(e) => handleDeleteSong(e, song.id)}
            showFolder={!currentFolder || currentFolder === 'unorganized'}
          />
        ))}
      </div>
    </div>
  );
}

interface SongListItemProps {
  song: Song;
  folderName: string | null;
  onPlay: () => void;
  onDelete: (e: React.MouseEvent) => void;
  showFolder: boolean;
}

function SongListItem({ song, folderName, onPlay, onDelete, showFolder }: SongListItemProps) {
  return (
    <div className="group px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
      <div className="flex items-center justify-between" onClick={onPlay}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {/* Image de l'album/chanson si disponible, sinon icône par défaut */}
              {song.songImageUrl ? (
                <img 
                  src={song.songImageUrl} 
                  alt={song.title}
                  className="w-10 h-10 rounded-lg object-cover"
                  onError={(e) => {
                    // Si l'image ne charge pas, afficher l'icône par défaut
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center ${song.songImageUrl ? 'hidden' : ''}`}>
                <MusicalNoteIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {song.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                {/* Image de l'artiste si disponible */}
                {song.artistImageUrl && (
                  <img 
                    src={song.artistImageUrl} 
                    alt={song.author}
                    className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <p className="text-sm text-gray-500 truncate">
                  {song.author || 'Auteur inconnu'}
                </p>
                {song.key && (
                  <>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-purple-600 font-medium">🎵</span>
                      <span className="text-xs text-purple-600 font-medium">{song.key}</span>
                    </div>
                  </>
                )}
                {song.capo && (
                  <>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-blue-600 font-medium">🎸</span>
                      <span className="text-xs text-blue-600 font-medium">Capo {song.capo}</span>
                    </div>
                  </>
                )}
                {song.rating && (
                  <>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-yellow-600 font-medium">⭐</span>
                      <span className="text-xs text-yellow-600 font-medium">{song.rating.toFixed(1)}</span>
                    </div>
                  </>
                )}
                {song.reviews && song.reviews > 0 && (
                  <>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-600 font-medium">👥</span>
                      <span className="text-xs text-gray-600 font-medium">{song.reviews}</span>
                    </div>
                  </>
                )}
                {showFolder && folderName && (
                  <>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center space-x-1">
                      <FolderIcon className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{folderName}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onPlay}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
            title="Ouvrir la chanson"
          >
            <PlayIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
            title="Supprimer la chanson"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
