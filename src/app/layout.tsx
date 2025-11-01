'use client'

import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <head>
        <title>TABasco App</title>
        <meta name="description" content="A modern music tabs application built with Next.js and Tailwind CSS" />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
