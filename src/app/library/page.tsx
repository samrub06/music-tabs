import { createServerClientSupabase } from '@/lib/supabase/server'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'

export default async function LibraryPage() {
  const supabase = await createServerClientSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch songs from Supabase - RLS will automatically filter based on user's auth state
  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, title, author, key, rating, reviews, difficulty, song_image_url, artist_image_url, created_at, updated_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)
  


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

      {/* Songs Grid */}
      {songs && songs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {songs.map((song: any) => (
            <Link 
              key={song.id} 
              href={`/song/${song.id}`}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
            >
              {/* Song Image or Default Icon */}
              <div className="relative w-full aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                {song.song_image_url ? (
                  <img 
                    src={song.song_image_url} 
                    alt={song.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MusicalNoteIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Song Info */}
              <div>
                <h3 className="font-semibold text-gray-900 truncate mb-1 group-hover:text-blue-600 transition-colors">
                  {song.title}
                </h3>
                <p className="text-sm text-gray-600 truncate mb-2">
                  {song.author}
                </p>

                {/* Metadata badges */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {song.key && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      🎵 {song.key}
                    </span>
                  )}
                  {song.rating && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
                      ⭐ {song.rating.toFixed(1)}
                    </span>
                  )}
                  {song.difficulty && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      🎸 {song.difficulty}
                    </span>
                  )}
                  {song.reviews && song.reviews > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-200">
                      👥 {song.reviews}
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

