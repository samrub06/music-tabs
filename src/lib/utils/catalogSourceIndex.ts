import {
  catalogTabIdLookupCandidates,
  deriveTabIdFromSourceUrl,
  isAllowedCatalogSourceHost,
  normalizeCatalogSourceUrl,
  normalizeTabId,
  type CatalogSourceIdentity,
} from '@/lib/utils/catalogSourceIdentity'

export type CatalogIndexSong = {
  id: string
  tabId?: string | null
  sourceUrl?: string | null
}

export type CatalogSourceIndex = {
  byTabId: Map<string, string>
  bySourceUrl: Map<string, string>
}

export type UserSongSourceRef = {
  id: string
  tabId?: string | null
  sourceUrl?: string | null
}

/**
 * Build in-memory catalog index keyed by tab_id candidates and normalized source_url.
 * Never indexes by title/author.
 */
export function buildCatalogSourceIndex(
  catalogSongs: CatalogIndexSong[]
): CatalogSourceIndex {
  const byTabId = new Map<string, string>()
  const bySourceUrl = new Map<string, string>()

  for (const song of catalogSongs) {
    const tabId = normalizeTabId(song.tabId)
    if (tabId) {
      if (!byTabId.has(tabId)) byTabId.set(tabId, song.id)
      // Also index ug: prefix / bare numeric interchangeably
      if (/^\d{5,}$/.test(tabId) && !byTabId.has(`ug:${tabId}`)) {
        byTabId.set(`ug:${tabId}`, song.id)
      }
      if (tabId.startsWith('ug:') && !byTabId.has(tabId.slice(3))) {
        byTabId.set(tabId.slice(3), song.id)
      }
    }

    const rawUrl = song.sourceUrl?.trim()
    if (!rawUrl) continue
    try {
      const normalized = normalizeCatalogSourceUrl(rawUrl)
      if (!bySourceUrl.has(normalized)) bySourceUrl.set(normalized, song.id)
      const derived = deriveTabIdFromSourceUrl(normalized)
      if (derived && !byTabId.has(derived)) byTabId.set(derived, song.id)
      if (derived && /^\d{5,}$/.test(derived) && !byTabId.has(`ug:${derived}`)) {
        byTabId.set(`ug:${derived}`, song.id)
      }
    } catch {
      // Keep raw as last-resort key for already-stored URLs that fail normalize
      if (!bySourceUrl.has(rawUrl)) bySourceUrl.set(rawUrl, song.id)
    }
  }

  return { byTabId, bySourceUrl }
}

/**
 * Try to build a soft identity from user song fields without throwing on bad hosts.
 * Returns null when neither tabId nor usable sourceUrl is present.
 */
export function tryUserSongSourceIdentity(
  song: UserSongSourceRef
): CatalogSourceIdentity | null {
  const tabId = normalizeTabId(song.tabId)
  const rawUrl = song.sourceUrl?.trim()

  if (!rawUrl && !tabId) return null

  if (rawUrl) {
    try {
      const url = new URL(rawUrl)
      if (!isAllowedCatalogSourceHost(url.hostname)) {
        // Disallowed host: only tabId can match
        if (!tabId) return null
        return { sourceUrl: rawUrl, tabId }
      }
      const sourceUrl = normalizeCatalogSourceUrl(rawUrl)
      return {
        sourceUrl,
        tabId: tabId ?? deriveTabIdFromSourceUrl(sourceUrl),
      }
    } catch {
      if (!tabId) return null
      return { sourceUrl: rawUrl, tabId }
    }
  }

  // tabId only — synthetic url placeholder unused for url lookup
  return { sourceUrl: '', tabId }
}

/**
 * Match a user song to a catalog id via tab_id / source_url only.
 * Never uses title or author.
 */
export function matchCatalogBySourceIdentity(
  userSong: UserSongSourceRef,
  index: CatalogSourceIndex
): string | null {
  const identity = tryUserSongSourceIdentity(userSong)
  if (!identity) return null

  if (identity.tabId || identity.sourceUrl) {
    const candidates = identity.sourceUrl
      ? catalogTabIdLookupCandidates(identity)
      : identity.tabId
        ? [
            identity.tabId,
            /^\d{5,}$/.test(identity.tabId) ? `ug:${identity.tabId}` : undefined,
            identity.tabId.startsWith('ug:') ? identity.tabId.slice(3) : undefined,
          ].filter((v): v is string => Boolean(v))
        : []

    for (const tabId of candidates) {
      const hit = index.byTabId.get(tabId)
      if (hit && hit !== userSong.id) return hit
    }
  }

  if (identity.sourceUrl) {
    const byUrl = index.bySourceUrl.get(identity.sourceUrl)
    if (byUrl && byUrl !== userSong.id) return byUrl
    const raw = userSong.sourceUrl?.trim()
    if (raw) {
      const byRaw = index.bySourceUrl.get(raw)
      if (byRaw && byRaw !== userSong.id) return byRaw
    }
  }

  return null
}

export function canPromoteUserSongToCatalog(song: UserSongSourceRef): boolean {
  const rawUrl = song.sourceUrl?.trim()
  if (!rawUrl) return false
  try {
    const url = new URL(rawUrl)
    return isAllowedCatalogSourceHost(url.hostname)
  } catch {
    return false
  }
}
