import { Providers } from '@/components/Providers'
import { defaultMetadata } from '@/lib/seo/site'
import { Inter, Heebo } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const heebo = Heebo({ subsets: ['latin', 'hebrew'], variable: '--font-heebo' })

export const metadata: Metadata = defaultMetadata

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                  const language = localStorage.getItem('language');
                  if (language === 'he') {
                    document.documentElement.lang = 'he';
                    document.documentElement.dir = 'rtl';
                  } else if (language === 'fr') {
                    document.documentElement.lang = 'fr';
                    document.documentElement.dir = 'ltr';
                  } else if (language === 'en') {
                    document.documentElement.lang = 'en';
                    document.documentElement.dir = 'ltr';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${heebo.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
