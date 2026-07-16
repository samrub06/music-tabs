import { Resend } from 'resend'

export type SendEmailInput = {
  to: string
  subject: string
  html: string
}

export type SendEmailResult = {
  id: string
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not defined')
  }
  return new Resend(apiKey)
}

function getFromAddress(): string {
  const from = process.env.RESEND_FROM_EMAIL
  if (!from) {
    throw new Error('RESEND_FROM_EMAIL is not defined')
  }
  return from
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resend = getResendClient()
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to: input.to,
    subject: input.subject,
    html: input.html,
  })

  if (error) {
    throw new Error(error.message || 'Failed to send email via Resend')
  }

  if (!data?.id) {
    throw new Error('Resend did not return an email id')
  }

  return { id: data.id }
}
