export type ShareLinkPayload = {
  url: string
  title?: string
  text?: string
}

export type ShareLinkResult = 'shared' | 'copied' | 'cancelled'

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** Prefer native share sheet; fall back to clipboard when unavailable or unsupported. */
export async function shareOrCopyLink(payload: ShareLinkPayload): Promise<ShareLinkResult> {
  const { url, title, text } = payload

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    const shareData: ShareData = { url }
    if (title) shareData.title = title
    if (text) shareData.text = text

    const canShare =
      typeof navigator.canShare !== 'function' || navigator.canShare(shareData)

    if (canShare) {
      try {
        await navigator.share(shareData)
        return 'shared'
      } catch (error) {
        if (isAbortError(error)) return 'cancelled'
      }
    }
  }

  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    throw new Error('Share is not supported on this device')
  }

  await navigator.clipboard.writeText(url)
  return 'copied'
}
