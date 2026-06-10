import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail, emailPartnerInvite, getOrigin } from '@/lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const rawEmail: unknown = body.partner_email

  // Allow clearing the partner email by sending an empty string.
  const partnerEmail = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
  const clearing = partnerEmail === ''

  if (!clearing) {
    if (!EMAIL_RE.test(partnerEmail) || partnerEmail.length > 254) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }
    if (user.email && partnerEmail === user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Partner email must be different from your own email' }, { status: 400 })
    }
  }

  const service = createServiceClient()

  // Only the primary account holder (user_id = user.id) can set/clear partner_email.
  const { data: registration } = await service
    .from('registrations')
    .select('id, first_name, surname, partner_email')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!registration) {
    return NextResponse.json({ error: 'No registration found' }, { status: 404 })
  }

  const prevEmail = registration.partner_email ?? ''
  const isNew = !clearing && partnerEmail !== prevEmail.toLowerCase()

  const update: Record<string, string | null> = {
    partner_email: clearing ? null : partnerEmail,
  }
  // If the partner email changes, clear any existing partner_user_id link so the
  // new partner has to log in and claim the booking themselves.
  if (isNew) update.partner_user_id = null

  const { error } = await service
    .from('registrations')
    .update(update)
    .eq('id', registration.id)

  if (error) throw error

  // Send the invite email to the new partner address.
  if (isNew) {
    const origin = getOrigin()
    const primaryName = `${registration.first_name} ${registration.surname}`.trim()
    await sendEmail(
      partnerEmail,
      "SharkFest 2027 — You've been added to a booking",
      emailPartnerInvite(primaryName, partnerEmail, origin)
    )
  }

  return NextResponse.json({ partner_email: clearing ? null : partnerEmail, invited: isNew })
}
