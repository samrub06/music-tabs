export default function DashboardLoading() {
  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* Sidebar Skeleton (hidden on mobile) */}
      <div className="hidden lg:block w-72 border-r border-gray-200 p-4 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-100 rounded w-32 animate-pulse"></div>
        </div>

        {/* Search Bar and Actions Skeleton */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 sm:max-w-2xl">
              <div className="h-10 bg-gray-100 rounded-lg w-full animate-pulse"></div>
            </div>
            <div className="w-full sm:w-auto">
              <div className="h-10 bg-blue-100 rounded-lg w-full sm:w-32 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          {/* Filter Bar Skeleton */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex gap-2">
            <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>

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
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
                  <div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

