'use client'

import Header from '@/components/Header'
import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { SidebarProvider, useSidebar } from '@/context/SidebarContext'
import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const { setSidebarOpen } = useSidebar()

  return (
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          {/* Main content - no sidebar for now */}
          <div className="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-hidden">
            {children}
          </div>
        </div>
  )
}

export default function ProtectedLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SidebarProvider>
          <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
        </SidebarProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

