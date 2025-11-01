'use client'

import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { AppProvider } from '@/context/AppContext'
import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function ProtectedLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Check if we're on a song page
  const isSongPage = pathname.includes('/song/')

  return (
    <LanguageProvider>
      <AuthProvider>
        <AppProvider>
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Header onMenuClick={() => setSidebarOpen(true)} />
            
            <div className="flex-1 flex overflow-hidden">
              {/* Mobile sidebar backdrop */}
              {sidebarOpen && (
                <div 
                  className="fixed inset-0 z-30 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
                </div>
              )}

              {/* Sidebar */}
              <div className={`
                fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:max-w-none
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              `}>
                <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:hidden">
                  <span className="text-lg font-semibold">Menu</span>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-md text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </div>

              {/* Main content */}
              <div className="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-hidden">
                {children}
              </div>
            </div>
          </div>
        </AppProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

