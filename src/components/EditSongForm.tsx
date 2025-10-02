'use client';

import { useApp } from '@/context/AppContext';
import { Song } from '@/types';
import { structuredSongToText } from '@/utils/structuredToText';
import { PencilIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

interface EditSongFormProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
}

export default function EditSongForm({ isOpen, onClose, song }: EditSongFormProps) {
  const { updateSong, folders } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    content: '',
    folderId: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Mettre à jour le formulaire quand la chanson change
  useEffect(() => {
    if (song) {
      setFormData({
        title: song.title,
        author: song.author,
        content: structuredSongToText(song),
        folderId: song.folderId || ''
      });
    }
  }, [song]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!song || !formData.title.trim()) {
      alert('Le titre est obligatoire.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Updating song:', song.id, {
        title: formData.title.trim(),
        author: formData.author.trim(),
        content: formData.content.trim(),
        folderId: formData.folderId || undefined
      });

      await updateSong(song.id, {
        title: formData.title.trim(),
        author: formData.author.trim(),
        content: formData.content.trim(),
        folderId: formData.folderId || undefined
      });

      console.log('Song updated successfully');
      onClose();
    } catch (error: any) {
      console.error('Error updating song:', error);
      
      // Vérifier si c'est un problème de configuration Supabase
      if (error.message && error.message.includes('Invalid API key')) {
        alert('Erreur de configuration : Les variables d\'environnement Supabase ne sont pas configurées. Veuillez créer un fichier .env.local avec vos clés Supabase.');
      } else {
        alert(`Erreur lors de la mise à jour de la chanson: ${error.message || error}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (song) {
      setFormData({
        title: song.title,
        author: song.author,
        content: structuredSongToText(song),
        folderId: song.folderId || ''
      });
    }
  };

  if (!isOpen || !song) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <PencilIcon className="h-5 w-5 mr-2" />
            Modifier la chanson
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Mise à jour...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
