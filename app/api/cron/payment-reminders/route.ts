// Daily cron: sends invoice-style payment reminder emails for instalment
// bookings whose due date is today.
// Triggered at 08:00 UTC by Vercel Cron (configured in vercel.json).
// Vercel sends Authorization: Bearer <CRON_SECRET> automatically.

import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, emailInstalmentReminder, getOrigin } from '@/lib/email'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const service = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)  // YYYY-MM-DD

  // Find all instalments whose due date is today.
  const { data: dueToday, error } = await service
    .from('instalments')
    .select('id, label, amount, due_date, registration_id')
    .eq('due_date', today)

  if (error) {
    console.error('[cron/payment-reminders] Failed to query instalments:', error)
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  const origin = getOrigin()
  let sent = 0
  let skipped = 0

  for (const ins of dueToday ?? []) {
    // Skip if this instalment has already been paid.
    const { data: paid } = await service
      .from('payments')
      .select('id')
      .eq('instalment_id', ins.id)
      .eq('status', 'paid')
      .maybeSingle()

    if (paid) { skipped++; continue }

    // Fetch the registrant's contact details.
    const { data: reg } = await service
      .from('registrations')
      .select('first_name, email')
      .eq('id', ins.registration_id)
      .single()

    if (!reg) { skipped++; continue }

    // Fetch the full instalment schedule for this registration (for context in email).
    const { data: allInstalments } = await service
      .from('instalments')
      .select('id, label, amount, due_date')
      .eq('registration_id', ins.registration_id)
      .order('due_date', { ascending: true, nullsFirst: false })

    // Determine which instalments have been paid.
    const { data: paidPayments } = await service
      .from('payments')
      .select('instalment_id')
      .eq('registration_id', ins.registration_id)
      .eq('status', 'paid')

    const paidIds = new Set(
      (paidPayments ?? []).map(p => p.instalment_id).filter((id): id is string => Boolean(id))
    )

    await sendEmail(
      reg.email,
      `SharkFest 2027 — ${ins.label} due today`,
      emailInstalmentReminder(reg, ins, allInstalments ?? [], paidIds, origin)
    )
    sent++
  }

  console.log(`[cron/payment-reminders] ${today}: sent=${sent} skipped=${skipped}`)
  return Response.json({ ok: true, date: today, sent, skipped })
}
