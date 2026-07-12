'use client'

import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { FoldersProvider } from '@/context/FoldersContext'
import { AddSongModalProvider } from '@/context/AddSongModalContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <FoldersProvider>
            <AddSongModalProvider>{children}</AddSongModalProvider>
          </FoldersProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
