export default function SongsLoading() {
  return (
    <div className="p-3 sm:p-6 overflow-y-auto">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="mb-6">
        <div className="h-10 bg-gray-100 rounded-lg w-full max-w-2xl animate-pulse"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header Skeleton */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex gap-4">
            <div className="h-4 bg-gray-300 rounded w-1/4 animate-pulse"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4 animate-pulse"></div>
            <div className="h-4 bg-gray-300 rounded w-1/6 animate-pulse"></div>
            <div className="h-4 bg-gray-300 rounded w-1/6 animate-pulse"></div>
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-1 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-1/4 animate-pulse"></div>
              </div>
              <div className="hidden sm:block w-1/4">
                <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
              </div>
              <div className="hidden md:block w-1/6">
                <div className="h-6 bg-purple-100 rounded w-8 animate-pulse"></div>
              </div>
              <div className="w-16 flex justify-end gap-2">
                <div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

