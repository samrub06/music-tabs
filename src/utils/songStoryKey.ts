function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Stable key shared across users and song clones (tab id preferred). */
export function buildSongStoryCanonicalKey(
  title: string,
  author: string,
  tabId?: string | null
): string {
  const tab = tabId?.trim()
  if (tab) {
    return `tab:${tab.toLowerCase()}`
  }
  return `song:${normalize(title)}|${normalize(author)}`
}
