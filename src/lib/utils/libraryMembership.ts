export type LibraryMembershipKind = 'personal' | 'library_link' | 'none'

/**
 * Prefer personal ownership when both a song row and a library link exist
 * (same rule as dual-read merge).
 */
export function classifyLibraryMembership(input: {
  songUserId: string | undefined | null
  currentUserId: string
  hasLibraryLink: boolean
}): LibraryMembershipKind {
  if (input.songUserId === input.currentUserId) return 'personal'
  if (input.hasLibraryLink) return 'library_link'
  return 'none'
}

/**
 * Split song ids into personal-owned vs candidates for library-link updates.
 * `ownedSongIds` = song rows where user_id === current user.
 */
export function splitPersonalAndLinkSongIds(input: {
  songIds: string[]
  ownedSongIds: Set<string>
}): { personalIds: string[]; linkCandidateIds: string[] } {
  const personalIds: string[] = []
  const linkCandidateIds: string[] = []
  const seen = new Set<string>()

  for (const id of input.songIds) {
    if (seen.has(id)) continue
    seen.add(id)
    if (input.ownedSongIds.has(id)) personalIds.push(id)
    else linkCandidateIds.push(id)
  }

  return { personalIds, linkCandidateIds }
}
