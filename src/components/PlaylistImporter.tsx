'use client';

import { useAuthContext } from '@/context/AuthContext';
import { folderService } from '@/lib/services/songService';
import { Folder, PlaylistData, PlaylistImportResult } from '@/types';
import { useEffect, useState } from 'react';

interface PlaylistImporterProps {
  onImportComplete?: (result: PlaylistImportResult) => void;
  targetFolderId?: string;
}

export default function PlaylistImporter({ onImportComplete, targetFolderId }: PlaylistImporterProps) {
  const { user, session } = useAuthContext();
  const [cookies, setCookies] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [importResult, setImportResult] = useState<PlaylistImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(targetFolderId || '');
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    currentSong: string;
    status: 'idle' | 'importing' | 'completed' | 'error';
  }>({
    current: 0,
    total: 0,
    currentSong: '',
    status: 'idle'
  });

  // Charger les dossiers au montage du composant
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const userFolders = await folderService.getAllFolders();
        setFolders(userFolders);
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    };
    
    loadFolders();
  }, []);

  const handleFetchPlaylists = async () => {
    if (!cookies.trim()) {
      setError('Veuillez fournir vos cookies Ultimate Guitar');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/playlists/import?cookies=${encodeURIComponent(cookies)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la récupération des playlists');
      }

      setPlaylists(data.playlists);
      setShowPlaylists(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportPlaylists = async () => {
    if (!cookies.trim()) {
      setError('Veuillez fournir vos cookies Ultimate Guitar');
      return;
    }

    setIsLoading(true);
    setError(null);
    setImportProgress({
      current: 0,
      total: 0,
      currentSong: '',
      status: 'importing'
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

      // Démarrer l'import avec progression
      const response = await fetch('/api/playlists/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          cookies,
          targetFolderId: selectedFolderId || null,
          maxConcurrent: 3
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'import des playlists');
      }

      setImportResult(data.results);
      setImportProgress(prev => ({
        ...prev,
        status: 'completed',
        current: data.results.summary.totalSongs,
        total: data.results.summary.totalSongs,
        currentSong: ''
      }));
      onImportComplete?.(data.results);
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

  const handleCookieExample = () => {
    const exampleCookies = `auth_token=your_auth_token; user_id=your_user_id; session_id=your_session_id`;
    setCookies(exampleCookies);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Importer vos playlists Ultimate Guitar
      </h2>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Instructions :</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Connectez-vous sur <a href="https://www.ultimate-guitar.com" target="_blank" rel="noopener noreferrer" className="underline">Ultimate Guitar</a></li>
          <li>2. Allez sur votre page &ldquo;My Tabs&rdquo; : <a href="https://www.ultimate-guitar.com/user/mytabs" target="_blank" rel="noopener noreferrer" className="underline">https://www.ultimate-guitar.com/user/mytabs</a></li>
          <li>3. Ouvrez les outils de développement (F12)</li>
          <li>4. Allez dans l&rsquo;onglet &ldquo;Network&rdquo; puis rechargez la page</li>
          <li>5. Cliquez sur la première requête, puis dans &ldquo;Headers&rdquo; copiez la valeur de &ldquo;Cookie&rdquo;</li>
          <li>6. Collez les cookies ci-dessous</li>
        </ol>
      </div>

      {/* Cookie input */}
      <div className="mb-4">
        <label htmlFor="cookies" className="block text-sm font-medium text-gray-700 mb-2">
          Cookies Ultimate Guitar
        </label>
        <textarea
          id="cookies"
          value={cookies}
          onChange={(e) => setCookies(e.target.value)}
          placeholder="Collez vos cookies Ultimate Guitar ici..."
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
        <button
          onClick={handleCookieExample}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Voir un exemple de format
        </button>
      </div>

      {/* Folder selection */}
      <div className="mb-4">
        <label htmlFor="folder" className="block text-sm font-medium text-gray-700 mb-2">
          Dossier de destination (optionnel)
        </label>
        <select
          id="folder"
          value={selectedFolderId}
          onChange={(e) => setSelectedFolderId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Aucun dossier (racine)</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Les chansons importées seront ajoutées dans ce dossier. Laissez vide pour les ajouter à la racine.
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleFetchPlaylists}
          disabled={isLoading || !cookies.trim()}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Récupération...' : 'Voir mes playlists'}
        </button>
        <button
          onClick={handleImportPlaylists}
          disabled={isLoading || !cookies.trim()}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Import...' : 'Importer toutes les chansons'}
        </button>
      </div>

      {/* Progress bar */}
      {importProgress.status === 'importing' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              Import en cours...
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
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-green-600 mr-2">✅</span>
            <span className="text-sm font-medium text-green-800">
              Import terminé ! {importResult?.summary.successfulImports} chansons importées
              {importResult?.summary?.failedImports && importResult.summary.failedImports > 0 && (
                <span className="text-orange-600">, {importResult.summary.failedImports} échecs</span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Playlists preview */}
      {showPlaylists && playlists.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Vos playlists ({playlists.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {playlists.map((playlist, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-md">
                <div className="font-medium text-gray-800">{playlist.name}</div>
                <div className="text-sm text-gray-600">
                  {playlist.songs.length} chanson{playlist.songs.length > 1 ? 's' : ''}
                </div>
                {playlist.songs.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Exemple: {playlist.songs[0].title} - {playlist.songs[0].artist}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import results */}
      {importResult && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-semibold text-green-800 mb-2">
            Import terminé !
          </h3>
          <div className="text-sm text-green-700 space-y-1">
            <div>Playlists traitées: {importResult.totalPlaylists}</div>
            <div>Chansons trouvées: {importResult.summary.totalSongs}</div>
            <div>Importées avec succès: {importResult.summary.successfulImports}</div>
            <div>Échecs: {importResult.summary.failedImports}</div>
          </div>
          
          {importResult.summary.errors.length > 0 && (
            <div className="mt-3">
              <div className="font-medium text-red-700 mb-1">Erreurs :</div>
              <div className="text-xs text-red-600 max-h-32 overflow-y-auto">
                {importResult.summary.errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warning */}
      <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-700">
          <strong>Note :</strong> Cette fonctionnalité utilise le système de scrapping existant pour trouver 
          les meilleures versions de vos chansons (celles avec le plus de reviews). 
          Le processus peut prendre plusieurs minutes selon le nombre de chansons.
        </p>
      </div>
    </div>
  );
}
