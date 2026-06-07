'use client'

import CuratedPlaylistRow from '@/components/library/CuratedPlaylistRow'
import { CURATED_PLAYLIST_SECTION_ORDER } from '@/data/curatedPlaylists'

export interface PublicPlaylistItem {
  id: string
  name: string
  imageUrl?: string
  songCount: number
  curatedSlug?: string
}

interface LibraryGridSectionProps {
  publicPlaylists: PublicPlaylistItem[]
  showLikedCard?: boolean
}

/** Renders all curated playlist rows together (legacy / fallback). */
export default function LibraryGridSection({
  publicPlaylists,
  showLikedCard = true,
}: LibraryGridSectionProps) {
  return (
    <>
      {CURATED_PLAYLIST_SECTION_ORDER.map((section, index) => (
        <CuratedPlaylistRow
          key={section}
          section={section}
          publicPlaylists={publicPlaylists}
          showLikedCard={index === 0 && showLikedCard}
        />
      ))}
    </>
  )
}
