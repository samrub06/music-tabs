export default function PlaylistLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 bg-purple-200 rounded mr-3 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Playlist Generator Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Generated Playlist Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-64 mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


