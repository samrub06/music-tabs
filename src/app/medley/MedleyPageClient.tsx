'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SparklesIcon } from '@heroicons/react/24/outline';
import MedleyGenerator from '@/components/MedleyGenerator';
import MedleyPlaylist from '@/components/MedleyPlaylist';
import { MedleyResult } from '@/lib/services/medleyService';
import { Song, Folder } from '@/types';
import { createPlaylistFromMedleyAction } from '@/app/(protected)/dashboard/actions';

interface MedleyPageClientProps {
  songs: Song[];
  folders: Folder[];
}

export default function MedleyPageClient({ songs, folders }: MedleyPageClientProps) {
  const router = useRouter();
  const [generatedMedley, setGeneratedMedley] = useState<MedleyResult | null>(null);

  const handleMedleyGenerated = (result: MedleyResult) => {
    setGeneratedMedley(result);
  };

  const handleSongSelect = (song: any) => {
    router.push(`/song/${song.id}`);
  };

  const handleCreatePlaylist = async (name: string, medley: MedleyResult) => {
    await createPlaylistFromMedleyAction(name, medley);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <SparklesIcon className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Créer un medley</h1>
          </div>
          <p className="text-gray-600">
            Utilisez l&apos;IA pour créer un medley parfait en analysant les tonalités et la compatibilité des accords
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Medley Generator */}
          <div>
            <MedleyGenerator 
              songs={songs} 
              folders={folders} 
              onMedleyGenerated={handleMedleyGenerated} 
            />
          </div>

          {/* Generated Medley */}
          <div>
            {generatedMedley ? (
              <MedleyPlaylist 
                medley={generatedMedley} 
                onSongSelect={handleSongSelect}
                onCreatePlaylist={handleCreatePlaylist}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <SparklesIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun medley généré
                  </h3>
                  <p className="text-gray-500">
                    Configurez vos préférences et générez votre premier medley
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

