import { z } from 'zod'

/** Split a comma-separated email field into trimmed addresses. */
export function parseInviteeEmails(raw: string): string[] {
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

/** Returns null when valid, or an error message key suffix / message when invalid. */
export function validateInviteeEmails(raw: string): string | null {
  const emails = parseInviteeEmails(raw)
  if (emails.length === 0) return null
  for (const email of emails) {
    if (!z.string().email().safeParse(email).success) {
      return email
    }
  }
  return null
}

export function normalizeInviteeEmailField(raw: string): string | null {
  const emails = parseInviteeEmails(raw)
  return emails.length > 0 ? emails.join(', ') : null
}

interface BuildInviteMailtoParams {
  emails: string[]
  inviteUrl: string
  subject: string
  body: string
}

/** Build a mailto: URL with optional recipients and prefilled subject/body. */
export function buildInviteMailto({
  emails,
  inviteUrl,
  subject,
  body,
}: BuildInviteMailtoParams): string {
  const to = emails.map((e) => encodeURIComponent(e)).join(',')
  const params = new URLSearchParams()
  params.set('subject', subject)
  params.set('body', body.includes(inviteUrl) ? body : `${body}\n\n${inviteUrl}`)
  const query = params.toString().replace(/\+/g, '%20')
  return to ? `mailto:${to}?${query}` : `mailto:?${query}`
}

export async function shareOrCopyInviteLink(params: {
  url: string
  title: string
  text: string
}): Promise<'shared' | 'copied'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: params.title,
        text: params.text,
        url: params.url,
      })
      return 'shared'
    } catch (error) {
      // User cancelled share sheet — fall through to copy only if not AbortError
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
    }
  }

  await navigator.clipboard.writeText(params.url)
  return 'copied'
}
