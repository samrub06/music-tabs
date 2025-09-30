export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-14 md:h-16">
          {/* Logo - Centered */}
          <div className="flex items-center space-x-2">
            <span className="text-xl md:text-2xl">🎸</span>
            <span className="text-lg font-semibold text-gray-900">
              Music Tabs
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
