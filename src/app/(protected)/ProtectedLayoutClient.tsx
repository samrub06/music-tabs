'use client'

import Header from '@/components/Header'
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

  return (
    <LanguageProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          {/* Main content - no sidebar for now */}
          <div className="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-hidden">
            {children}
          </div>
        </div>
      </AuthProvider>
    </LanguageProvider>
  )
}

