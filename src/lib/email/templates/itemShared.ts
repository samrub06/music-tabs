export type ItemSharedEmailContent = {
  subject: string
  html: string
}

export function buildItemSharedEmail(input: {
  ownerName: string
  entityType: 'song' | 'playlist'
  entityTitle: string
  openUrl: string
}): ItemSharedEmailContent {
  const kind = input.entityType === 'song' ? 'song' : 'playlist'
  const subject = `${input.ownerName} shared a ${kind} with you on TABasco`

  return {
    subject,
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
                <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;font-weight:700;">Something new was shared with you</h1>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#444;">
                  ${escapeHtml(input.ownerName)} shared the ${kind}
                  <strong>"${escapeHtml(input.entityTitle)}"</strong> with you.
                </p>
                <a href="${escapeHtml(input.openUrl)}" style="display:inline-block;background:#b45309;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:15px;font-weight:600;">
                  Open ${kind}
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
