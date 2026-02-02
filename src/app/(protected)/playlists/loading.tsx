export default function PlaylistsLoading() {
  return (
    <div className="p-3 sm:p-6 overflow-y-auto">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
      </div>

      {/* Playlists Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-12 animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-24 animate-pulse"></div>
            <div className="mt-4 space-y-2">
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full animate-pulse"></div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
