/**
 * Dual-read merge: prefer personal copies when both a library link and a
 * clone exist for the same catalog id.
 */
export function mergeLibrarySongIds(input: {
  personalSongIds: string[]
  linkedSongIds: string[]
  personalClonedFromIds: Map<string, string | undefined>
}): string[] {
  const coveredCatalogIds = new Set<string>()
  for (const personalId of input.personalSongIds) {
    const clonedFrom = input.personalClonedFromIds.get(personalId)
    if (clonedFrom) coveredCatalogIds.add(clonedFrom)
  }

  const out = [...input.personalSongIds]
  const personalIdSet = new Set(input.personalSongIds)

  for (const linkedId of input.linkedSongIds) {
    if (personalIdSet.has(linkedId)) continue
    if (coveredCatalogIds.has(linkedId)) continue
    out.push(linkedId)
  }
  return out
}

export type LibraryFolderRef = {
  songId: string
  folderId: string | null
}

/**
 * Merge personal + library-link folder refs without double-counting
 * a catalog song that already has a personal clone.
 */
export function mergeFolderSongCountRefs(input: {
  personal: LibraryFolderRef[]
  linked: LibraryFolderRef[]
  personalClonedFromIds: Map<string, string | undefined>
}): Map<string, number> {
  const coveredCatalogIds = new Set<string>()
  input.personalClonedFromIds.forEach((clonedFrom) => {
    if (clonedFrom) coveredCatalogIds.add(clonedFrom)
  })

  const counts = new Map<string, number>()
  const bump = (folderId: string | null) => {
    const key = folderId || 'null'
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  for (const ref of input.personal) {
    bump(ref.folderId)
  }

  for (const ref of input.linked) {
    if (coveredCatalogIds.has(ref.songId)) continue
    // If personal already owns this song id somehow, skip
    if (input.personal.some((p) => p.songId === ref.songId)) continue
    bump(ref.folderId)
  }

  return counts
}
