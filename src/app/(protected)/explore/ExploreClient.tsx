'use client';

import { Song, Folder } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useState } from 'react';
import { cloneSongAction } from '../dashboard/actions';
import { PlusIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ExploreClientProps {
  trendingSongs: Song[];
  folders: Folder[];
}

export default function ExploreClient({ trendingSongs, folders }: ExploreClientProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const handleAddSong = async (song: Song) => {
    try {
      setAdding(song.id);
      await cloneSongAction(song.id);
      setAdded(prev => new Set(prev).add(song.id));
      router.refresh(); // Refresh to update any counts or state if needed
    } catch (error) {
      console.error('Error adding song:', error);
      alert('Error adding song to library');
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="p-3 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          🔥 {t('explore.title') || 'Explore Trends'}
        </h1>
        <p className="text-sm text-gray-600">
          {t('explore.subtitle') || 'Discover the most popular songs right now.'}
        </p>
      </div>

      {/* Songs Grid */}
      {trendingSongs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {trendingSongs.map((song) => (
            <div 
              key={song.id} 
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
            >
              {/* Image */}
              <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                {song.songImageUrl ? (
                  <img 
                    src={song.songImageUrl} 
                    alt={song.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🎸
                  </div>
                )}
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-end justify-end p-2">
                  {/* Action buttons could go here */}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex-1 mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-1" title={song.title}>
                    {song.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-1" title={song.author}>
                    {song.author}
                  </p>
                  
                  {/* Metadata Badges */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {song.rating && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">
                        ⭐ {song.rating.toFixed(1)}
                      </span>
                    )}
                    {song.difficulty && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                        {song.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                {/* Add Button */}
                <button
                  onClick={() => handleAddSong(song)}
                  disabled={adding === song.id || added.has(song.id)}
                  className={`w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    added.has(song.id)
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {adding === song.id ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : added.has(song.id) ? (
                    <>
                      <CheckIcon className="h-4 w-4 mr-1.5" />
                      {t('explore.added') || 'Added'}
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4 mr-1.5" />
                      {t('explore.add') || 'Add to Library'}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
          <p className="text-gray-500">No trending songs found. Check back later!</p>
        </div>
      )}
    </div>
  );
}

