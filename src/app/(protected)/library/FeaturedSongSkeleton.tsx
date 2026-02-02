export default function FeaturedSongSkeleton() {
  return (
    <div className="mb-8">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-5 animate-pulse"></div>
      <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse">
        <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
          <div className="flex justify-end">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="w-14 h-14 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex-1 pr-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
