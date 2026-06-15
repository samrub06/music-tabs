/**
 * Maps curated playlist slugs to local files in /genre.
 * Upload via: npm run upload:genre-images
 */
export const CURATED_PLAYLIST_COVER_FILES: Record<string, string> = {
  // Genre
  rock: 'hippie_2.jpeg',
  metal: 'metal.png',
  pop: 'pop.jpeg',
  folk: 'folk.jpeg',
  country: 'country.jpeg',
  soundtrack: 'soundtrack.jpeg',
  'rnb-funk-soul': 'rnb.jpeg',
  religious: 'religious.jpeg',
  'hip-hop': 'hiphop.jpeg',
  electronic: 'electro.jpeg',
  'world-music': 'World.jpeg',
  classical: 'classical.jpeg',
  jazz: 'jazz.jpeg',
  reggae: 'reggae.jpeg',
  blues: 'Blues.jpeg',
  disco: 'disco.jpeg',
  // Jewish
  'chabad-nigunim': 'habad.jpeg',
  hassidic: 'hassidim.jpeg',
  carlebach: 'Karlebach.jpeg',
  'moroccan-piyut': 'marroco.jpeg',
  tunisian: 'Tunis.jpeg',
  'modern-israeli': 'israel.jpeg',
  'ishay-ribo': 'israel.jpeg',
  'yosef-karduner': 'yosef.jpeg',
  akiva: 'akiva.jpeg',
  // Decades
  '60s': '60s.jpeg',
  '70s': '70s.jpeg',
  '80s': '80s.jpeg',
  '90s': '90s.jpeg',
  '2000s': '2000.jpeg',
  '2010s': '2010.jpeg',
  '2020s': '2020.jpeg',
}

export const LIKED_SONGS_COVER_FILE = 'favoritesong.jpeg'
export const RECENT_SONGS_COVER_FILE = 'myrecentsong.jpeg'

const STORAGE_PREFIX = 'genres'

function getSpecialCoverUrl(storageFileName: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return `${base}/storage/v1/object/public/catalog-images/${STORAGE_PREFIX}/${storageFileName}`
}

export function getCuratedPlaylistCoverStoragePath(slug: string): string | null {
  const file = CURATED_PLAYLIST_COVER_FILES[slug]
  if (!file) return null
  const ext = file.slice(file.lastIndexOf('.'))
  return `${STORAGE_PREFIX}/${slug}${ext}`
}

export function getCuratedPlaylistCoverUrl(slug: string): string | null {
  const path = getCuratedPlaylistCoverStoragePath(slug)
  if (!path) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return `${base}/storage/v1/object/public/catalog-images/${path}`
}

export function getLikedSongsCoverUrl(): string | null {
  const ext = LIKED_SONGS_COVER_FILE.slice(LIKED_SONGS_COVER_FILE.lastIndexOf('.'))
  return getSpecialCoverUrl(`liked-songs${ext}`)
}

export function getRecentSongsCoverUrl(): string | null {
  const ext = RECENT_SONGS_COVER_FILE.slice(RECENT_SONGS_COVER_FILE.lastIndexOf('.'))
  return getSpecialCoverUrl(`recent-songs${ext}`)
}
