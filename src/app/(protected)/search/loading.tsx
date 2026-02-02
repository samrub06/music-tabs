import { MusicalNoteIcon } from '@heroicons/react/24/outline'

export default function SearchLoading() {
  return (
    <div className="p-3 sm:p-6 overflow-y-auto">
      {/* Search Input Skeleton */}
      <div className="mb-6">
        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg w-full animate-pulse"></div>
      </div>

      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-32 animate-pulse"></div>
      </div>

      {/* Songs Grid Skeleton */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <div 
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Image Skeleton */}
            <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <MusicalNoteIcon className="h-10 w-10 text-gray-200 dark:text-gray-600 animate-pulse" />
            </div>

            {/* Content Skeleton */}
            <div className="p-1.5 sm:p-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-2 animate-pulse"></div>
              
              {/* Badges Skeleton */}
              <div className="flex flex-wrap gap-1">
                <div className="h-4 w-8 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-100 dark:border-purple-800 animate-pulse"></div>
                <div className="h-4 w-10 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-100 dark:border-yellow-800 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
