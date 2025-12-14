'use client'

import { useState } from 'react'
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface LibrarySidebarProps {
  onClose?: () => void
}

export default function LibrarySidebar({ onClose }: LibrarySidebarProps) {
  const [selectedDecade, setSelectedDecade] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedCapo, setSelectedCapo] = useState<string | null>(null)

  const decades = [
    { label: '2020s', count: '80,499' },
    { label: '2010s', count: '344,744' },
    { label: '2000s', count: '409,361' },
    { label: '1990s', count: '205,091' },
    { label: '1980s', count: '110,870' },
  ]

  const genres = [
    { label: 'Rock', count: '1,233,880' },
    { label: 'Metal', count: '249,672' },
    { label: 'Pop', count: '249,135' },
    { label: 'Folk', count: '238,666' },
    { label: 'Country', count: '130,331' },
  ]

  const capos = [
    { label: 'No capo', count: '1,877,060' },
    { label: 'With capo', count: '270,873' },
  ]

  return (
    <aside className="w-72 bg-white shadow-sm border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
       

        {/* Décennies */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <FunnelIcon className="h-4 w-4 mr-1" />
            Décennie
          </h3>
          <div className="space-y-2">
            {decades.map((decade) => (
              <button
                key={decade.label}
                onClick={() => setSelectedDecade(
                  selectedDecade === decade.label ? null : decade.label
                )}
                className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedDecade === decade.label
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>{decade.label}</span>
                <span className="text-xs text-gray-500">{decade.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Genres */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Genre</h3>
          <div className="space-y-2">
            {genres.map((genre) => (
              <button
                key={genre.label}
                onClick={() => setSelectedGenre(
                  selectedGenre === genre.label ? null : genre.label
                )}
                className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedGenre === genre.label
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>{genre.label}</span>
                <span className="text-xs text-gray-500">{genre.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Capo */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Capo</h3>
          <div className="space-y-2">
            {capos.map((capo) => (
              <button
                key={capo.label}
                onClick={() => setSelectedCapo(
                  selectedCapo === capo.label ? null : capo.label
                )}
                className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCapo === capo.label
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>{capo.label}</span>
                <span className="text-xs text-gray-500">{capo.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Clear filters button */}
        {(selectedDecade || selectedGenre || selectedCapo) && (
          <button
            onClick={() => {
              setSelectedDecade(null)
              setSelectedGenre(null)
              setSelectedCapo(null)
            }}
            className="w-full mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Effacer les filtres
          </button>
        )}
      </div>
    </aside>
  )
}

