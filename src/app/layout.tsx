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
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || ((theme === 'system' || !theme) && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                  const storedLanguage = localStorage.getItem('language');
                  let language = storedLanguage;
                  if (language !== 'he' && language !== 'fr' && language !== 'en') {
                    const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
                    const code = nav.split('-')[0];
                    if (code === 'fr') language = 'fr';
                    else if (code === 'he' || code === 'iw') language = 'he';
                    else language = 'en';
                  }
                  if (language === 'he') {
                    document.documentElement.lang = 'he';
                    document.documentElement.dir = 'rtl';
                  } else if (language === 'fr') {
                    document.documentElement.lang = 'fr';
                    document.documentElement.dir = 'ltr';
                  } else {
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
