'use client';

import { useApp } from '@/context/AppContext';
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface AddSongFormProps {
  isOpen: boolean;
  onClose: () => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Le titre et le contenu sont obligatoires.');
      return;
    }

    addSong({
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  placeholder="ex: Someone You Loved"
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
                  placeholder="ex: Lewis Capaldi"
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
C                          G
I'm going under and this time
Am                         F
I fear there's no one to save me...`}
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
