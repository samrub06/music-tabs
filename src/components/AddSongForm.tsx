'use client';

import { useApp } from '@/context/AppContext';
import { DocumentTextIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface AddSongFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  title: string;
  author: string;
  url: string;
  source: string;
  reviews?: number; // Nombre de reviews/évaluations
}

export default function AddSongForm({ isOpen, onClose }: AddSongFormProps) {
  const { addSong, folders, importSongs } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    content: '',
    folderId: ''
  });
  const [isImporting, setIsImporting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Le titre et le contenu sont obligatoires.');
      return;
    }

    await addSong({
      title: formData.title.trim(),
      author: formData.author.trim(),
      content: formData.content.trim(),
      folderId: formData.folderId || undefined
    });

    // Reset form
    setFormData({
      title: '',
      author: '',
      content: '',
      folderId: ''
    });

    onClose();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsImporting(true);
    const importedSongs = [];

    for (const file of Array.from(files)) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        try {
          const content = await file.text();
          const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
          
          // Try to detect title and author from content
          const lines = content.split('\n').filter(line => line.trim());
          let title = fileName;
          let author = '';
          
          if (lines.length > 0) {
            const firstLine = lines[0].trim();
            // Check if first line looks like a title
            if (firstLine && !firstLine.match(/^\[/) && !firstLine.match(/^[A-G]/)) {
              title = firstLine;
              
              // Check if second line could be an author
              if (lines.length > 1) {
                const secondLine = lines[1].trim();
                if (secondLine && !secondLine.match(/^\[/) && !secondLine.match(/^[A-G]/)) {
                  // Check if it looks like an author line
                  if (secondLine.toLowerCase().includes('by ') || 
                      secondLine.match(/^[-–—]\s*/) ||
                      secondLine.match(/^\([^)]+\)$/)) {
                    author = secondLine.replace(/^(by\s+|[-–—]\s*|\(|\))/, '').trim();
                  }
                }
              }
            }
          }

          importedSongs.push({
            title,
            author,
            content,
            folderId: formData.folderId || undefined
          });
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
        }
      }
    }

    if (importedSongs.length > 0) {
      importSongs(importedSongs as any[]);
      alert(`${importedSongs.length} chanson(s) importée(s) avec succès !`);
      onClose();
    }

    setIsImporting(false);
    // Reset file input
    e.target.value = '';
  };

  const handleReset = () => {
    setFormData({
      title: '',
      author: '',
      content: '',
      folderId: ''
    });
    setSearchResults([]);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Rechercher sur les tabs de guitare (EN/FR)
  const handleSearchUltimateGuitar = async () => {
    if (!searchQuery.trim()) {
      alert('Veuillez entrer un titre ou un artiste à rechercher.');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(`/api/songs/search?q=${encodeURIComponent(searchQuery)}&source=ultimate-guitar`);
      const data = await response.json();

      if (response.ok && data.results) {
        setSearchResults(data.results);
        setShowSearchResults(true);
      } else {
        alert(data.error || 'Aucune partition trouvée.');
      }
    } catch (error) {
      console.error('Error searching:', error);
      alert('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setIsSearching(false);
    }
  };

  // Rechercher sur Tab4U (hébreu)
  const handleSearchTab4U = async () => {
    if (!searchQuery.trim()) {
      alert('נא להזין שם שיר או אמן.');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(`/api/songs/search?q=${encodeURIComponent(searchQuery)}&source=tab4u`);
      const data = await response.json();

      if (response.ok && data.results) {
        setSearchResults(data.results);
        setShowSearchResults(true);
      } else {
        alert(data.error || 'לא נמצאו תוצאות ב-Tab4U.');
      }
    } catch (error) {
      console.error('Error searching:', error);
      alert('שגיאה בחיפוש. נסה שוב.');
    } finally {
      setIsSearching(false);
    }
  };

  // Récupérer une partition depuis une URL
  const handleFetchFromUrl = async (url: string) => {
    setIsSearching(true);

    try {
      const response = await fetch(`/api/songs/search?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (response.ok && data.song) {
        // Pré-remplir le formulaire avec les données récupérées
        setFormData({
          ...formData,
          title: data.song.title,
          author: data.song.author,
          content: data.song.content
        });
        setShowSearchResults(false);
        alert('Partition récupérée avec succès !');
      } else {
        alert(data.error || 'Impossible de récupérer la partition.');
      }
    } catch (error) {
      console.error('Error fetching song:', error);
      alert('Erreur lors de la récupération. Veuillez réessayer.');
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Ajouter une nouvelle chanson
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Online Search */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-800 flex items-center">
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              Recherche en ligne
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre ou Artiste
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUltimateGuitar()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ex: Hotel California Eagles"
                  disabled={isSearching}
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSearchUltimateGuitar}
                  disabled={isSearching || !searchQuery.trim()}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="text-lg">🎸</span>
                  {isSearching ? 'Recherche...' : 'EN/FR'}
                </button>
                <button
                  onClick={handleSearchTab4U}
                  disabled={isSearching || !searchQuery.trim()}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="text-lg">🇮🇱</span>
                  {isSearching ? 'מחפש...' : 'עברית'}
                </button>
              </div>

              {/* Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="border border-gray-300 rounded-md p-3 max-h-96 overflow-y-auto">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">
                    Résultats ({searchResults.length})
                  </h5>
                  <div className="space-y-2">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleFetchFromUrl(result.url)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {result.title}
                            </div>
                            <div className="text-xs text-gray-600">
                              {result.author}
                            </div>
                          </div>
                          {result.reviews !== undefined && result.reviews > 0 && (
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-2">
                              ⭐ {result.reviews} avis
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-md">
                <p className="font-medium mb-1">💡 Comment utiliser :</p>
                <ul className="space-y-1">
                  <li>• <strong>🎸 EN/FR</strong> : Pour les chansons en anglais/français</li>
                  <li>• <strong>🇮🇱 עברית</strong> : לשירים בעברית</li>
                  <li>• Cliquez sur un résultat pour le charger dans le formulaire</li>
                  <li>• Les résultats sont triés par popularité (⭐ avis)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Manual Entry Form */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-800 flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              Saisie manuelle
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ex: Ma chanson préférée"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auteur
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ex: Mon Artiste"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dossier
                </label>
                <select
                  value={formData.folderId}
                  onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Aucun dossier</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenu (accords + paroles) *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder={`[Intro]
C   G   Am  F

[Verse 1]
C                    G
Voici un exemple de chanson
Am                   F
Avec les accords alignés...`}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Effacer
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Ajouter la chanson
                </button>
              </div>
            </form>
          </div>

          {/* File Import */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-800 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Import de fichiers
            </h4>
            
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Importer des fichiers .txt
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      Sélectionnez un ou plusieurs fichiers texte contenant vos chansons
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    accept=".txt,text/plain"
                    onChange={handleFileImport}
                    disabled={isImporting}
                  />
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isImporting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isImporting ? 'Import en cours...' : 'Choisir des fichiers'}
                  </button>
                </div>
              </div>
            </div>

            {/* Folder Selection for Import */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dossier pour les fichiers importés
              </label>
              <select
                value={formData.folderId}
                onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Aucun dossier</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <p className="font-medium mb-1">💡 Conseils pour l&apos;import :</p>
              <ul className="text-xs space-y-1">
                <li>• Le nom du fichier sera utilisé comme titre si aucun titre n&apos;est détecté</li>
                <li>• La première ligne non-accord sera considérée comme le titre</li>
                <li>• La deuxième ligne peut être détectée comme l&apos;auteur</li>
                <li>• Les accords sont automatiquement reconnus (ex: C, Am, F#m7)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
