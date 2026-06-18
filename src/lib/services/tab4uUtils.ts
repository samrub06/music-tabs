/** Strip Tab4U rating suffixes like "4(1 דירוג)" from artist names. */
export function cleanTab4uAuthor(author: string): string {
  return author
    .replace(/\d+(?:\.\d+)?\([\d\sמדרגיםדירוג.]+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseTab4uLinkText(fullText: string): { title: string; author: string } | null {
  const text = fullText.trim()
  if (!text || text === 'טאבים' || text === 'תווים') return null
  if (text.includes('ללא אקורדים')) return null

  const slashIndex = text.indexOf(' / ')
  if (slashIndex === -1) {
    const title = text.replace(/\d+(?:\.\d+)?\([\d\sמדרגיםדירוג.]+\)/g, '').trim()
    return title ? { title, author: 'Unknown' } : null
  }

  const title = text.slice(0, slashIndex).trim()
  const author = cleanTab4uAuthor(text.slice(slashIndex + 3))
  if (!title) return null
  return { title, author: author || 'Unknown' }
}

export function buildTab4uCategoryUrl(cat: number, offset: number, pageSize = 30): string {
  const params = new URLSearchParams({
    tab: 'songs',
    q: '',
    content: '',
    type: '',
    cat: String(cat),
    max_chords: '0',
    n: String(pageSize),
    sort: '',
    s: String(offset),
  })
  return `https://www.tab4u.com/resultsSimple?${params.toString()}`
}

export function parseTab4uTotalResults(html: string): number | undefined {
  const match = html.match(/נמצאו\s+(\d+)\s+תוצאות/)
  return match ? Number.parseInt(match[1], 10) : undefined
}

const TAB4U_ORIGIN = 'https://www.tab4u.com'

function toTab4uAbsoluteUrl(path: string | undefined): string | undefined {
  if (!path) return undefined
  const trimmed = path.replace(/^['"]|['"]$/g, '').trim()
  if (!trimmed || trimmed.includes('noArtPic')) return undefined
  if (trimmed.startsWith('http')) return trimmed
  return `${TAB4U_ORIGIN}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`
}

/** Artist / song preview images embedded in Tab4U song page markup. */
export function parseTab4uCoverImages(html: string): {
  artistImageUrl?: string
  songImageUrl?: string
} {
  const artistRel = html
    .match(/artPicOnTop[^>]+background-image:url\(([^)]+)\)/)?.[1]
    ?.replace(/^['"]|['"]$/g, '')

  const songNoteRel =
    html.match(/background-image:url\(\/(songsNotes\/[^)"+\s]+\.(?:jpg|jpeg))\)/i)?.[1] ??
    html.match(/\/(songsNotes\/[A-Za-z0-9]+Pre\.jpg)/)?.[1]

  const proPictureRel = html.match(
    /background-image:url\(\/(images\/proPicture\/[^)"+\s]+\.(?:jpg|jpeg|png))[^)]*\)/i
  )?.[1]

  const artistImageUrl = toTab4uAbsoluteUrl(artistRel)
  const songImageUrl = toTab4uAbsoluteUrl(songNoteRel ?? proPictureRel)

  return { artistImageUrl, songImageUrl }
}
