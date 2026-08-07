/** Curated playlists that use explorer artist banners (artists + Israeli era shelves). */
export const ARTIST_PLAYLIST_SLUGS = new Set([
  'classic-israeli',
  'modern-israeli',
  'hanan-ben-ari',
  'aharon-razel',
  'eviatar-banai',
  'shuli-rand',
  'ishay-ribo',
  'yosef-karduner',
  'akiva',
  'ben-zur',
  'eyal-golan',
  'omer-adam',
  'eden-hason',
  'sarit-hadad',
  'moshe-peretz',
  'nathan-goshen',
  'idan-raichel',
  'shlomo-artzi',
  'static-ben-el',
  'noa-kirel',
  'itay-levi',
  'osher-cohen',
  'avi-ohayon',
  'carlebach',
])

export function isArtistPlaylistSlug(slug?: string | null): boolean {
  return !!slug && ARTIST_PLAYLIST_SLUGS.has(slug)
}
