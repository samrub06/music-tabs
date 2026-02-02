'use client'

import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { FoldersProvider } from '@/context/FoldersContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <FoldersProvider>
            {children}
          </FoldersProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

