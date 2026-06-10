import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { sendEmail, getAdminEmails } from '@/lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function makeRef(): string {
  return 'SA28-' + String(Math.floor(1000 + Math.random() * 9000))
}

export async function POST(request: Request) {
  try {
    // Public endpoint that writes to the DB — throttle abuse.
    const limit = rateLimit(`sa-tour:${clientIp(request)}`, 5, 10 * 60_000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many attempts — please wait a few minutes and try again.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      )
    }

    const body = await request.json()
    const { name, email, adults, kids, company } = body

    // Honeypot: a filled hidden field means a bot. Pretend success, write nothing.
    if (typeof company === 'string' && company.trim() !== '') {
      return NextResponse.json({ ref: makeRef() })
    }

    if (typeof name !== 'string' || !name.trim() || name.length > 120) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 })
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    const nAdults = Math.min(12, Math.max(1, parseInt(String(adults), 10) || 2))
    const nKids   = Math.min(12, Math.max(0, parseInt(String(kids), 10) || 0))

    const service = createServiceClient()
    const ref = makeRef()
    const cleanEmail = email.trim().toLowerCase()

    const { error } = await service.from('sa_tour_interest').insert({
      ref,
      name: name.trim(),
      email: cleanEmail,
      adults: nAdults,
      kids: nKids,
    })
    if (error) {
      console.error('[sa-tour] insert failed:', error)
      return NextResponse.json({ error: 'Something went wrong — please try again.' }, { status: 500 })
    }

    // Best-effort heads-up to the club — never block the signup on email.
    try {
      const admins = getAdminEmails()
      if (admins.length) {
        const line = `${name.trim()} <${cleanEmail}> — ${nAdults} adult(s), ${nKids} kid(s) — ref ${ref}`
        await sendEmail(admins, 'SA Tour 2028 — new interest registration', {
          html: `<p>New interest registered for the SA Tour 2028:</p><p><strong>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong></p>`,
          text: `New interest registered for the SA Tour 2028:\n\n${line}`,
        })
      }
    } catch (err) {
      console.error('[email] sa-tour admin notice failed:', err)
    }

    return NextResponse.json({ ref })
  } catch (err) {
    console.error('[sa-tour] request failed:', err)
    return NextResponse.json({ error: 'Something went wrong — please try again.' }, { status: 500 })
  }
}
