import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'
import { sendEmail, emailPaymentReminder, getOrigin } from '@/lib/email'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !adminEmails().includes(user.email!)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { registration_id } = await request.json()
  if (!registration_id) {
    return NextResponse.json({ error: 'Missing registration_id' }, { status: 400 })
  }

  const service = createServiceClient()

  const [regRes, planRes, paidRes] = await Promise.all([
    service.from('registrations').select('first_name, email').eq('id', registration_id).single(),
    service.from('payment_plans').select('total_amount').eq('registration_id', registration_id).maybeSingle(),
    service.from('payments').select('amount').eq('registration_id', registration_id).eq('status', 'paid'),
  ])

  if (regRes.error || !regRes.data) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
  }
  if (!planRes.data) {
    return NextResponse.json({ error: 'No payment plan allocated' }, { status: 400 })
  }

  const totalPaid = (paidRes.data ?? []).reduce((s, p) => s + p.amount, 0)
  const outstanding = planRes.data.total_amount - totalPaid

  if (outstanding <= 0) {
    return NextResponse.json({ error: 'No outstanding balance' }, { status: 400 })
  }

  await sendEmail(
    regRes.data.email,
    'Friendly reminder — outstanding balance on your SharkFest 2027 booking',
    emailPaymentReminder(regRes.data, outstanding, getOrigin())
  )

  return NextResponse.json({ ok: true, outstanding })
}
