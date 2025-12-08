'use client'

import Link from 'next/link'
import type { Song } from '@/types'

interface SongTableCompactProps {
  songs: Song[]
}

export default function SongTableCompact({ songs }: SongTableCompactProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Title</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Author</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Key</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Rating</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {songs.map((song) => (
            <tr key={song.id} className="hover:bg-gray-50">
              <td className="px-3 py-2">
                <Link href={`/song/${song.id}`} className="text-blue-600 hover:underline">
                  {song.title}
                </Link>
              </td>
              <td className="px-3 py-2 text-gray-700">{song.author}</td>
              <td className="px-3 py-2 text-gray-700">{song.key || '-'}</td>
              <td className="px-3 py-2 text-gray-700">{song.rating ? song.rating.toFixed(1) : '-'}</td>
              <td className="px-3 py-2 text-gray-500">{song.updatedAt ? new Date(song.updatedAt).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}



