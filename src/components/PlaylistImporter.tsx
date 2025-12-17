'use client';

import { useAuthContext } from '@/context/AuthContext';
import { ImportProgress, ImportResult } from '@/lib/services/simplePlaylistImporter';
import { folderRepo } from '@/lib/services/folderRepo';
import { supabase } from '@/lib/supabase';
import { Folder } from '@/types';
import { useEffect, useState } from 'react';

interface PlaylistImporterProps {
  onImportComplete?: (result: ImportResult) => void;
  targetFolderId?: string;
}

export default function PlaylistImporter({ onImportComplete, targetFolderId }: PlaylistImporterProps) {
  const { user, session } = useAuthContext();
  const [playlistText, setPlaylistText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(targetFolderId || '');
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    currentSong: '',
    status: 'idle'
  });
  const [useAiOrganization, setUseAiOrganization] = useState(true);

  // Charger les dossiers au montage du composant
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const repo = folderRepo(supabase);
        const userFolders = await repo.getAllFolders();
        setFolders(userFolders);
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    };
    
    loadFolders();
  }, []);

  const handleParsePlaylist = () => {
    if (!playlistText.trim()) {
      setError('Veuillez coller le contenu de votre playlist');
      return;
    }

    setError(null);
    // Le parsing se fait côté serveur lors de l'import
  };

  const handleImportPlaylist = async () => {
    if (!playlistText.trim()) {
      setError('Veuillez coller le contenu de votre playlist');
      return;
    }

    console.log('🚀 Starting playlist import from UI...');
    console.log('📊 UI State:', {
      playlistTextLength: playlistText.length,
      useAiOrganization,
      selectedFolderId,
      hasUser: !!user,
      hasSession: !!session
    });

    setIsLoading(true);
    setError(null);
    setImportProgress({
      current: 0,
      total: 0,
      currentSong: 'Démarrage de l\'importation...',
      status: 'parsing'
    });

    try {
      // Vérifier que l'utilisateur est connecté via le contexte
      if (!user || !session) {
        throw new Error('Vous devez être connecté pour importer des chansons');
      }

      console.log('🔐 Using user from context:', {
        userId: user.id,
        email: user.email,
        hasSession: !!session,
        hasAccessToken: !!session?.access_token
      });

      // Démarrer l'import avec progression SSE
      console.log('📡 Sending API request with SSE...');
      const response = await fetch('/api/playlists/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text: playlistText,
          targetFolderId: selectedFolderId || null,
          useAiOrganization: useAiOrganization,
          useSSE: true  // Activer le mode SSE
        }),
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData.error);
        throw new Error(errorData.error || 'Erreur lors de l\'import de la playlist');
      }

      // Gérer le stream SSE
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Stream non disponible');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Garder la dernière ligne incomplète
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('📡 SSE Data received:', data);
              
              if (data.type === 'progress') {
                // Mettre à jour le progrès
                setImportProgress({
                  current: data.data.current,
                  total: data.data.total,
                  currentSong: data.data.currentSong,
                  status: data.data.status
                });
              } else if (data.type === 'complete') {
                // Import terminé
                console.log('🎉 Import completed:', data.data);
                setImportResult(data.data.results);
                setImportProgress(prev => ({ ...prev, status: 'completed' }));
              } else if (data.type === 'error') {
                // Erreur
                console.error('❌ Import error:', data.data);
                throw new Error(data.data.details || 'Erreur lors de l\'import');
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setImportProgress(prev => ({
        ...prev,
        status: 'error'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleText = () => {
    const exampleText = `A Star Is Born - Shallow (ver 2)
Jan 29, 2022 	Chords	
Ed Sheeran	
Photograph
Jan 29, 2022 	Official	
Coldplay	
Viva La Vida
Feb 1, 2022 	Official	
Jason Mraz	
Im Yours (ver 11)
Feb 1, 2022 	Chords`;
    setPlaylistText(exampleText);
  };



  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column - Instructions and Input */}
        <div>
          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-3">Comment importer :</h3>
            <div className="space-y-3 text-sm text-blue-700">
              <div className="flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</span>
                <span>Allez sur <a href="https://www.ultimate-guitar.com/user/mytabs" target="_blank" rel="noopener noreferrer" className="underline font-medium">votre page MyTabs</a></span>
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</span>
                <span>Sélectionnez tout (Ctrl+A) et copiez (Ctrl+C)</span>
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</span>
                <span>Collez dans la zone ci-dessous</span>
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">4</span>
                <span>Cliquez sur &ldquo;Importer&rdquo;</span>
              </div>
            </div>
          </div>

          {/* Playlist text input */}
          <div className="mb-4">
            <label htmlFor="playlistText" className="block text-sm font-medium text-gray-700 mb-2">
              Contenu de votre playlist
            </label>
            <textarea
              id="playlistText"
              value={playlistText}
              onChange={(e) => setPlaylistText(e.target.value)}
              placeholder="Collez ici le contenu de votre playlist MyTabs..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={6}
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Right column - Controls, Progress and Results */}
        <div>
          {/* Controls */}
          <div className="mb-6 space-y-4">
            {/* Example button */}
            <div>
              <button
                onClick={handleExampleText}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Voir un exemple de format
              </button>
            </div>

            {/* Folder selection */}
            <div>
              <label htmlFor="folder" className="block text-sm font-medium text-gray-700 mb-2">
                Dossier de destination
              </label>
              <select
                id="folder"
                value={useAiOrganization ? 'ai-organization' : selectedFolderId}
                onChange={(e) => {
                  if (e.target.value === 'ai-organization') {
                    setUseAiOrganization(true);
                    setSelectedFolderId('');
                  } else {
                    setUseAiOrganization(false);
                    setSelectedFolderId(e.target.value);
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ai-organization">🤖 Organisation Auto (IA / Genre)</option>
                <option value="">Aucun dossier (racine)</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
              {useAiOrganization && (
                <p className="mt-1 text-xs text-purple-600">
                  L&apos;IA organisera vos chansons par dossier (Artiste ou Genre).
                </p>
              )}
            </div>

            {/* Action button */}
            <div>
              <button
                onClick={handleImportPlaylist}
                disabled={isLoading || !playlistText.trim()}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Import...' : 'Importer la playlist'}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {(importProgress.status === 'parsing' || importProgress.status === 'searching' || importProgress.status === 'importing') && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">
                  {importProgress.status === 'parsing' && 'Analyse de la playlist...'}
                  {importProgress.status === 'searching' && 'Recherche des meilleures versions...'}
                  {importProgress.status === 'importing' && 'Import en cours...'}
                </span>
                <span className="text-sm text-blue-600">
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: importProgress.total > 0
                      ? `${(importProgress.current / importProgress.total) * 100}%`
                      : '0%'
                  }}
                ></div>
              </div>
              {importProgress.currentSong && (
                <p className="text-sm text-blue-700 mt-2 truncate">
                  🎵 {importProgress.currentSong}
                </p>
              )}
            </div>
          )}

          {/* Success message */}
          {importProgress.status === 'completed' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✅</span>
                  <span className="text-sm font-medium text-green-800">
                    Import terminé ! {importResult?.success} chansons importées
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {importResult?.failed && importResult.failed > 0 && (
                    <span className="text-orange-600 mr-2">{importResult.failed} échecs</span>
                  )}
                  {importResult?.duplicates && importResult.duplicates > 0 && (
                    <span className="text-blue-600">{importResult.duplicates} doublons</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Folders created */}
          {importProgress.status === 'completed' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-blue-600 mr-2">📁</span>
                <span className="text-sm font-medium text-blue-800">
                  {importResult?.aiFolders && importResult.aiFolders.length > 0 
                    ? `Dossiers créés par l'IA (${importResult.aiFolders.length})`
                    : 'Aucun dossier créé'
                  }
                </span>
              </div>
              {importResult?.aiFolders && importResult.aiFolders.length > 0 ? (
                <>
                  <div className="space-y-1">
                    {importResult.aiFolders.map((folder, index) => (
                      <div key={folder.id} className="flex items-center justify-between text-xs text-blue-700">
                        <span>• {folder.name}</span>
                        <span className="text-gray-500">({folder.songsCount} chansons)</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-blue-600">
                    💡 Vous pouvez modifier ces dossiers dans la section &quot;Mes dossiers&quot;
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-600">
                  Les chansons ont été importées dans le dossier racine ou le dossier sélectionné
                </div>
              )}
            </div>
          )}


          {/* Songs preview */}
          {importResult && importResult.songs.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 text-gray-800">
                Détail ({importResult.songs.length} chansons)
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {importResult.songs.map((song, index) => (
                  <div key={index} className={`p-2 rounded text-sm ${
                    song.status === 'success' ? 'bg-green-50 text-green-800' :
                    song.status === 'duplicate' ? 'bg-blue-50 text-blue-800' :
                    'bg-red-50 text-red-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{song.title} - {song.artist}</span>
                      <span className="ml-2 text-xs">
                        {song.status === 'success' && '✅'}
                        {song.status === 'duplicate' && '⚠️'}
                        {song.status === 'failed' && '❌'}
                      </span>
                    </div>
                    {song.status === 'failed' && song.error && (
                      <div className="text-xs text-red-600 mt-1 truncate">
                        {song.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
    </div>
  );
}
