/**
 * Unicode-aware slugify for song/artist URLs.
 * Keeps Hebrew letters and Latin alphanumerics; collapses other chars to `-`.
 * (Avoids `\p{L}` so TypeScript es5 target stays happy.)
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9\u0590-\u05ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function songSlugFromTitleAuthor(title: string, author: string): string {
  const base = slugify(`${title}-${author}`)
  return base || 'song'
}

export function artistSlugFromAuthor(author: string): string {
  const base = slugify(author)
  return base || 'artist'
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}
