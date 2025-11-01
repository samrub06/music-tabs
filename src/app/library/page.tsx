import { createServerClientSupabase } from '@/lib/supabase/server'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'

export default async function LibraryPage() {
  const supabase = await createServerClientSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch songs from Supabase - RLS will automatically filter based on user's auth state
  const { data: songsData, error } = await supabase
    .from('songs')
    .select('id, title, author, key, rating, reviews, difficulty, song_image_url, artist_image_url, created_at, updated_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)
  
  // Map snake_case to camelCase
  const songs = songsData?.map((song: any) => ({
    ...song,
    songImageUrl: song.song_image_url,
    artistImageUrl: song.artist_image_url,
  })) || []

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Erreur lors du chargement des chansons: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 overflow-y-auto">
      {/* Banner pour encourager la connexion si non connecté */}
      {!user && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🎸 Bibliothèque de chansons
              </h3>
              <p className="text-sm text-gray-600">
                Connecte-toi pour accéder à plus de chansons et gérer ta collection personnelle
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Bibliothèque de chansons
        </h1>
        <p className="text-sm text-gray-600">
          {songs && songs.length > 0 
            ? `${songs.length} ${songs.length > 1 ? 'chansons disponibles' : 'chanson disponible'}`
            : 'Aucune chanson disponible pour le moment'}
        </p>
      </div>

      {/* Songs Grid - Shopify style avec cartes plus petites */}
      {songs && songs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {songs.map((song: any) => (
            <Link 
              key={song.id} 
              href={`/song/${song.id}`}
              className="group bg-white rounded-lg overflow-hidden transition-all hover:shadow-lg border border-gray-200 hover:border-gray-300"
            >
              {/* Song Image or Default Icon - plus petite carte */}
              <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                {song.songImageUrl ? (
                  <img 
                    src={song.songImageUrl} 
                    alt={song.title}
                    
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MusicalNoteIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Song Info - compacte comme Shopify */}
              <div className="p-2 sm:p-3">
                <h3 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors min-h-[2.5rem]">
                  {song.title}
                </h3>
                <p className="text-xs text-gray-600 truncate mb-2">
                  {song.author}
                </p>

                {/* Metadata badges - plus petites */}
                <div className="flex flex-wrap gap-1">
                  {song.key && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-200">
                      🎵
                    </span>
                  )}
                  {song.rating && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">
                      ⭐ {song.rating.toFixed(1)}
                    </span>
                  )}
                  {song.difficulty && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      🎸
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-12 text-center">
            <div className="flex flex-col items-center">
              <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Aucune chanson disponible
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                La bibliothèque est vide pour le moment
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
