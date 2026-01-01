export default function ChordsLoading() {
  return (
    <div className="p-3 sm:p-6 overflow-y-auto">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
      </div>

      {/* Chords Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="h-20 bg-gray-100 rounded mb-3 animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

