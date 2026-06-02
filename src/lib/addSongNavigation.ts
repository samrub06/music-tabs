export function buildAddSongPageUrl(opts?: {
  query?: string
  autoSearch?: boolean
  folderId?: string
}): string {
  const params = new URLSearchParams()
  if (opts?.query?.trim()) {
    params.set('q', opts.query.trim())
    if (opts.autoSearch) {
      params.set('autoSearch', '1')
    }
  }
  if (opts?.folderId) {
    params.set('folderId', opts.folderId)
  }
  const qs = params.toString()
  return `/add-song${qs ? `?${qs}` : ''}`
}
