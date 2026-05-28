import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, emailRegistrationUser, emailRegistrationAdmin, getOrigin, getAdminEmails } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      first_name, surname, email, mobile,
      adults, kids, accommodation, electric_hookup,
      vehicle_reg, notes,
    } = body

    if (!first_name?.trim() || !surname?.trim() || !email?.trim() || !mobile?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!['Tent', 'Caravan', 'Mobile Home', 'Campervan'].includes(accommodation)) {
      return NextResponse.json({ error: 'Invalid accommodation type' }, { status: 400 })
    }

    const service = createServiceClient()

    const parsedAdults = Math.max(1, parseInt(adults) || 1)
    const parsedKids   = Math.max(0, parseInt(kids)   || 0)
    const parsedHookup = Boolean(electric_hookup)

    const { data, error } = await service
      .from('registrations')
      .insert({
        first_name: first_name.trim(),
        surname: surname.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        adults: parsedAdults,
        kids: parsedKids,
        accommodation,
        electric_hookup: parsedHookup,
        vehicle_reg: vehicle_reg?.trim() || null,
        notes: notes?.trim() || null,
        year: 2028,
        status: 'pending',
      })
      .select('id, email, first_name, surname, mobile, adults, kids, accommodation, electric_hookup')
      .single()

    if (error) throw error

    const origin   = getOrigin()
    const admins   = getAdminEmails()

    // Non-blocking — failures don't affect the response
    Promise.allSettled([
      sendEmail(data.email, 'SharkFest 2028 — Registration received', emailRegistrationUser(data, origin)),
      ...admins.map(to =>
        sendEmail(to, `New registration: ${data.first_name} ${data.surname}`, emailRegistrationAdmin(data, origin))
      ),
    ]).catch(() => {})

    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Registration failed' },
      { status: 500 }
    )
  }
}
