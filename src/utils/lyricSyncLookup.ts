/**
 * Ordered song ids to try when loading a lyric sync.
 * Personal clone first, then catalog id via clonedFromId.
 */
export function lyricSyncLookupSongIds(
  songId: string,
  clonedFromId?: string | null
): string[] {
  const ids: string[] = [songId]
  if (clonedFromId && clonedFromId !== songId) {
    ids.push(clonedFromId)
  }
  return ids
}
