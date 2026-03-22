import { existsSync } from 'node:fs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import nodemailer, { type SendMailOptions, type Transporter } from 'nodemailer'

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || process.env.GMAIL_USER || 'hello.turtleshell@gmail.com'
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || CONTACT_EMAIL
const SENDMAIL_PATH = process.env.SENDMAIL_PATH || '/usr/sbin/sendmail'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildHtml(data: Record<string, string>) {
  const rows = Object.entries(data)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;color:#94a3b8;white-space:nowrap;vertical-align:top">${escapeHtml(
          k
        )}</td><td style="padding:6px 12px;color:#e2e8f0;white-space:pre-wrap">${escapeHtml(
          v || '-'
        )}</td></tr>`
    )
    .join('')
  return `
    <div style="font-family:Inter,sans-serif;background:#0a0a0f;color:#e2e8f0;padding:32px;border-radius:12px;max-width:620px">
      <h2 style="color:#93c5fd;margin:0 0 20px">${escapeHtml(data['Type'] || 'New Request')}</h2>
      <table style="width:100%;border-collapse:collapse;background:#111827;border-radius:8px;overflow:hidden">
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:24px;font-size:12px;color:#475569">Sent from shell.portarab.com</p>
    </div>`
}

function buildText(data: Record<string, string>) {
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${value || '-'}`)
    .join('\n')
}

type MailTransportCandidate = {
  name: string
  transporter: Transporter
}

function getTransportCandidates() {
  const candidates: MailTransportCandidate[] = []
  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN
  const appPassword = process.env.GMAIL_APP_PASSWORD

  if (clientId && clientSecret && refreshToken) {
    candidates.push({
      name: 'gmail-oauth2',
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: CONTACT_EMAIL,
          clientId,
          clientSecret,
          refreshToken,
        },
      }),
    })
  }

  if (CONTACT_EMAIL && appPassword) {
    candidates.push({
      name: 'gmail-app-password',
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: CONTACT_EMAIL,
          pass: appPassword,
        },
      }),
    })
  }

  if (existsSync(SENDMAIL_PATH)) {
    candidates.push({
      name: 'sendmail',
      transporter: nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: SENDMAIL_PATH,
      }),
    })
  }

  return candidates
}

function serializeError(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: String(error) }
  }

  const extra = error as Error & {
    code?: string
    command?: string
    response?: string
    responseCode?: number
  }

  return {
    name: error.name,
    message: error.message,
    code: extra.code,
    command: extra.command,
    response: extra.response,
    responseCode: extra.responseCode,
  }
}

async function sendWithFallback(message: SendMailOptions) {
  const candidates = getTransportCandidates()

  if (candidates.length === 0) {
    console.error('[CONTACT SEND ERROR] No mail transport configured', {
      contactEmail: CONTACT_EMAIL,
      sendmailPath: SENDMAIL_PATH,
      hasGmailClientId: Boolean(process.env.GMAIL_CLIENT_ID),
      hasGmailClientSecret: Boolean(process.env.GMAIL_CLIENT_SECRET),
      hasGmailRefreshToken: Boolean(process.env.GMAIL_REFRESH_TOKEN),
      hasGmailAppPassword: Boolean(process.env.GMAIL_APP_PASSWORD),
    })
    throw new Error('Mail transport not configured')
  }

  const failures: Array<{ transport: string; error: ReturnType<typeof serializeError> }> = []

  for (const candidate of candidates) {
    try {
      const info = await candidate.transporter.sendMail(message)
      console.log('[CONTACT SEND SUCCESS]', {
        transport: candidate.name,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      })
      return
    } catch (error) {
      failures.push({ transport: candidate.name, error: serializeError(error) })
    }
  }

  console.error('[CONTACT SEND ERROR] All transports failed', {
    contactEmail: CONTACT_EMAIL,
    failures,
  })
  throw new Error('Mail delivery failed')
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'sign_in_required' }, { status: 401 })
    }

    const body = (await request.json()) as Record<string, string>
    if (!body.email) body.email = user.email || ''

    const type = body.type || 'contact'
    let subject = ''
    let tableData: Record<string, string> = {}

    if (type === 'support') {
      subject = `[Support] ${body.subject || 'New support request'}`
      tableData = {
        Type: 'Support Request',
        Email: body.email || '',
        Category: body.category || '',
        Subject: body.subject || '',
        Message: body.message || '',
        Source: body.source || '',
      }
    } else if (type === 'deletion') {
      subject = `[Account Deletion] Request from ${body.email || 'unknown'}`
      tableData = {
        Type: 'Account Deletion Request',
        Email: body.email || '',
        'User ID': body.user_id || '',
        Reason: body.reason || 'none',
        Details: body.details || '',
      }
    } else {
      subject = `[Contact] ${body.project || 'General'} - ${body.name || 'Anonymous'}`
      tableData = {
        Type: 'Contact Request',
        Name: body.name || '',
        Email: body.email || '',
        'Phone / WhatsApp': body.whatsapp || body.phone || '',
        Service: body.project || '',
        Message: body.message || '',
      }
    }

    await sendWithFallback({
      from: `"TURTLESHELL" <${FROM_EMAIL}>`,
      to: CONTACT_EMAIL,
      subject,
      html: buildHtml(tableData),
      text: buildText(tableData),
      replyTo: body.email || FROM_EMAIL,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[CONTACT SEND ERROR] Request failed', serializeError(err))
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
