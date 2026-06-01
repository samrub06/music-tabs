import type { Song } from '@/types'

type UserSongRef = Pick<Song, 'id' | 'tabId' | 'sourceUrl' | 'title' | 'author'>

type CatalogSongRef = Pick<Song, 'tabId' | 'sourceUrl' | 'title' | 'author'>

export function findUserSongMatch(
  catalogSong: CatalogSongRef,
  userSongs: UserSongRef[]
): UserSongRef | undefined {
  if (catalogSong.tabId) {
    const byTabId = userSongs.find((s) => s.tabId === catalogSong.tabId)
    if (byTabId) return byTabId
  }

  if (catalogSong.sourceUrl) {
    const bySource = userSongs.find((s) => s.sourceUrl === catalogSong.sourceUrl)
    if (bySource) return bySource
  }

  const title = catalogSong.title.toLowerCase().trim()
  const author = catalogSong.author.toLowerCase().trim()
  return userSongs.find(
    (s) =>
      s.title.toLowerCase().trim() === title &&
      s.author.toLowerCase().trim() === author
  )
}
