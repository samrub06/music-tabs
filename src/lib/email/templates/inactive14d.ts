export type Inactive14dEmailContent = {
  subject: string
  html: string
}

export function buildInactive14dEmail(input: {
  displayName?: string | null
  siteUrl: string
}): Inactive14dEmailContent {
  const name = input.displayName?.trim() || 'there'
  const loginUrl = `${input.siteUrl.replace(/\/$/, '')}/`

  return {
    subject: 'Your songs are waiting on TABasco',
    html: `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f6f6f4;font-family:Georgia,serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f6f4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px 28px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#b45309;">TABasco</p>
                <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;font-weight:700;">Hey ${escapeHtml(name)}, ready to jam?</h1>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#444;">
                  It has been a little while since you last opened TABasco. Your library, playlists, and practice tools are still here.
                </p>
                <p style="margin:0 0 28px;font-size:16px;line-height:1.5;color:#444;">
                  Pick up where you left off and play something today.
                </p>
                <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#b45309;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:15px;font-weight:600;">
                  Open TABasco
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim(),
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
