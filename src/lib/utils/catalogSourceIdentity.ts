/** Allowed hosts for catalog resolve-or-create from search. */
const ALLOWED_HOST_SUFFIXES = [
  'ultimate-guitar.com',
  'tabs.ultimate-guitar.com',
  'tab4u.com',
  'www.tab4u.com',
  'negina.co.il',
  'www.negina.co.il',
] as const

export type CatalogSourceIdentity = {
  tabId?: string
  sourceUrl: string
}

export function isAllowedCatalogSourceHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '')
  return ALLOWED_HOST_SUFFIXES.some((allowed) => {
    const normalized = allowed.replace(/^www\./, '')
    return host === normalized || host.endsWith(`.${normalized}`)
  })
}

/** Strip tracking params; keep path stable for matching. */
export function normalizeCatalogSourceUrl(rawUrl: string): string {
  const url = new URL(rawUrl.trim())
  url.hash = ''
  // Drop common tracking / session params; keep path + meaningful query
  for (const key of Array.from(url.searchParams.keys())) {
    if (/^(utm_|fbclid|gclid|session|ref)/i.test(key)) {
      url.searchParams.delete(key)
    }
  }
  // Prefer https + no trailing slash (except root)
  url.protocol = 'https:'
  let href = url.toString()
  if (href.endsWith('/') && url.pathname !== '/') {
    href = href.slice(0, -1)
  }
  return href
}

export function assertAllowedCatalogSourceUrl(rawUrl: string): string {
  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    throw new Error('Invalid source URL')
  }
  if (!isAllowedCatalogSourceHost(url.hostname)) {
    throw new Error(`Source host not allowed: ${url.hostname}`)
  }
  return normalizeCatalogSourceUrl(rawUrl)
}

/** Derive stable tab ids from known source URLs when scrape metadata lacks tabId. */
export function deriveTabIdFromSourceUrl(sourceUrl: string): string | undefined {
  try {
    const url = new URL(sourceUrl)
    const host = url.hostname.toLowerCase()
    const pathname = url.pathname

    if (host.includes('negina.co.il')) {
      const parts = pathname.split('/').filter(Boolean)
      const chordsIndex = parts.indexOf('chords')
      if (chordsIndex !== -1 && parts.length >= chordsIndex + 3) {
        return `negina:${parts[chordsIndex + 1]}:${parts[chordsIndex + 2]}`
      }
      return undefined
    }

    if (host.includes('tab4u.com')) {
      const match = pathname.match(/tabs\/songs\/(\d+)/i)
      return match ? `tab4u:${match[1]}` : undefined
    }

    if (host.includes('ultimate-guitar.com')) {
      const match = pathname.match(/(?:tab\/view\/|[-_/])(\d{5,})(?:[/?#]|$)/i)
      // Store as plain numeric string to match trending/scrape tab ids
      return match ? match[1] : undefined
    }

    return undefined
  } catch {
    return undefined
  }
}

export function normalizeTabId(
  tabId: string | number | null | undefined
): string | undefined {
  if (tabId == null || tabId === '') return undefined
  return String(tabId).trim() || undefined
}

/**
 * Build lookup identity for catalog resolve.
 * Prefer explicit tabId; always keep normalized sourceUrl.
 * Never uses title/author (avoids mixing UG vs Negina).
 */
export function buildCatalogSourceIdentity(input: {
  url: string
  tabId?: string | number | null
}): CatalogSourceIdentity {
  const sourceUrl = assertAllowedCatalogSourceUrl(input.url)
  const tabId =
    normalizeTabId(input.tabId) ?? deriveTabIdFromSourceUrl(sourceUrl)
  return { sourceUrl, tabId }
}

/** Ordered tabId candidates to try when looking up (exact + derived). */
export function catalogTabIdLookupCandidates(identity: CatalogSourceIdentity): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const add = (value?: string) => {
    if (!value || seen.has(value)) return
    seen.add(value)
    out.push(value)
  }
  add(identity.tabId)
  add(deriveTabIdFromSourceUrl(identity.sourceUrl))
  // Legacy songbook prefix for UG
  if (identity.tabId && /^\d{5,}$/.test(identity.tabId)) {
    add(`ug:${identity.tabId}`)
  }
  const derived = deriveTabIdFromSourceUrl(identity.sourceUrl)
  if (derived && /^\d{5,}$/.test(derived)) {
    add(`ug:${derived}`)
  }
  return out
}

export function findUserSongBySourceIdentity<
  T extends { id: string; tabId?: string; sourceUrl?: string },
>(
  identity: CatalogSourceIdentity,
  userSongs: T[]
): T | undefined {
  const tabCandidates = new Set(catalogTabIdLookupCandidates(identity))
  if (tabCandidates.size > 0) {
    const byTab = userSongs.find((s) => s.tabId && tabCandidates.has(s.tabId))
    if (byTab) return byTab
  }
  const normalized = identity.sourceUrl
  return userSongs.find((s) => {
    if (!s.sourceUrl) return false
    try {
      return normalizeCatalogSourceUrl(s.sourceUrl) === normalized
    } catch {
      return s.sourceUrl === identity.sourceUrl
    }
  })
}
