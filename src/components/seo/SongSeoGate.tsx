import type { ReactNode } from 'react'

/**
 * Keeps crawlable SEO markup in the document (screen-reader / visually hidden)
 * while the interactive viewer remains the visible UI. Same chords/lyrics content.
 */
export function SongSeoGate({ children }: { children: ReactNode }) {
  return (
    <div className="sr-only" data-seo-gate>
      {children}
    </div>
  )
}
