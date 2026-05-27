import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      first_name, surname, email, mobile,
      adults, kids, accommodation, electric_hookup,
      vehicle_reg, notes,
    } = body

    // Basic validation
    if (!first_name?.trim() || !surname?.trim() || !email?.trim() || !mobile?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!['Tent', 'Caravan', 'Mobile Home', 'Campervan'].includes(accommodation)) {
      return NextResponse.json({ error: 'Invalid accommodation type' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data, error } = await service
      .from('registrations')
      .insert({
        first_name: first_name.trim(),
        surname: surname.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        adults: Math.max(1, parseInt(adults) || 1),
        kids: Math.max(0, parseInt(kids) || 0),
        accommodation,
        electric_hookup: Boolean(electric_hookup),
        vehicle_reg: vehicle_reg?.trim() || null,
        notes: notes?.trim() || null,
        year: 2028,
        status: 'pending',
      })
      .select('id, email, first_name, surname')
      .single()

    if (error) throw error

    // Send emails (non-blocking — failures are silent)
    sendEmails(data).catch(() => {})

    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Registration failed' },
      { status: 500 }
    )
  }
}

async function sendEmails(reg: { id: string; email: string; first_name: string; surname: string }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sharkfest.vercel.app'
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

  const userHtml = `
    <h2>Registration received — SharkFest 2028</h2>
    <p>Hi ${reg.first_name},</p>
    <p>Thank you for registering for SharkFest 2028! We have your details and will be in touch with your pitch allocation and payment plan shortly.</p>
    <p>You can view your booking at any time by signing in at:<br>
    <a href="${origin}/my-booking">${origin}/my-booking</a></p>
    <p>See you at the Sharks! 🦈</p>
    <p style="color:#888;font-size:12px">Torbay Sharks RFC · SharkFest 2028 · Devon Coast</p>
  `

  const adminHtml = `
    <h2>New registration — SharkFest 2028</h2>
    <p><strong>${reg.first_name} ${reg.surname}</strong> (${reg.email}) has registered.</p>
    <p>View and manage registrations:<br>
    <a href="${origin}/admin">${origin}/admin</a></p>
  `

  await Promise.allSettled([
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'SharkFest <noreply@sharkfest.vercel.app>',
        to: [reg.email],
        subject: 'SharkFest 2028 — Registration received',
        html: userHtml,
      }),
    }),
    ...adminEmails.map(to =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'SharkFest <noreply@sharkfest.vercel.app>',
          to: [to],
          subject: `New registration: ${reg.first_name} ${reg.surname}`,
          html: adminHtml,
        }),
      })
    ),
  ])
}
