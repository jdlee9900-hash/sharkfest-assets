import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'
import nodemailer from 'nodemailer'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails().includes(user.email!)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpHost = process.env.SMTP_HOST ?? 'smtp.gmail.com'
  const smtpPort = Number(process.env.SMTP_PORT ?? 587)
  const emailFrom = process.env.EMAIL_FROM ?? `SharkFest <${smtpUser}>`

  const config = {
    SMTP_HOST: smtpHost,
    SMTP_PORT: smtpPort,
    SMTP_USER: smtpUser ?? '(not set)',
    SMTP_PASS: smtpPass ? `(set, ${smtpPass.length} chars)` : '(not set)',
    EMAIL_FROM: emailFrom,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? '(not set)',
  }

  if (!smtpUser || !smtpPass) {
    return NextResponse.json({ ok: false, step: 'config', config, error: 'SMTP_USER or SMTP_PASS missing' })
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false,
    auth: { user: smtpUser, pass: smtpPass },
  })

  // Step 1: verify connection
  try {
    await transporter.verify()
  } catch (err) {
    return NextResponse.json({
      ok: false, step: 'verify', config,
      error: err instanceof Error ? err.message : String(err),
    })
  }

  // Step 2: send a real test email to the admin
  const url = new URL(request.url)
  const sendTo = url.searchParams.get('to') ?? smtpUser
  try {
    const info = await transporter.sendMail({
      from: emailFrom,
      to: sendTo,
      subject: 'SharkFest — SMTP test email',
      html: '<p>If you received this, SMTP is working correctly.</p>',
    })
    return NextResponse.json({ ok: true, step: 'sent', config, messageId: info.messageId, accepted: info.accepted, rejected: info.rejected })
  } catch (err) {
    return NextResponse.json({
      ok: false, step: 'send', config,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
