import type { Song } from '@/types'

type SongPermissionRef = Pick<Song, 'userId' | 'isPublic' | 'tabId'>

export function isCatalogSong(song: SongPermissionRef): boolean {
  return Boolean(song.isPublic) || !song.userId || Boolean(song.tabId?.startsWith('curated:'))
}

export function canEditSong(
  song: SongPermissionRef,
  options: { userId?: string; isAdmin?: boolean }
): boolean {
  if (!options.userId) return false
  if (song.userId === options.userId) return true
  if (options.isAdmin) return true
  return false
}

export function canDeleteSong(
  song: SongPermissionRef,
  options: { userId?: string; isAdmin?: boolean }
): boolean {
  return canEditSong(song, options)
}
