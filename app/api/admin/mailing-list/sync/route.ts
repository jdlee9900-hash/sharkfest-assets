import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/admin'

export async function POST() {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Fetch sources concurrently
  const [regResult, memResult] = await Promise.all([
    service
      .from('registrations')
      .select('email, first_name, surname')
      .not('status', 'eq', 'cancelled'),
    service
      .from('memberships')
      .select('email')
      .in('status', ['active', 'past_due']),
  ])

  // Fetch existing contacts to avoid overwriting unsubscribed or richer name data
  const { data: existing } = await service
    .from('mailing_list_contacts')
    .select('email, first_name, last_name, unsubscribed')

  type ExistingContact = { email: string; first_name: string; last_name: string; unsubscribed: boolean }
  const existingMap = new Map<string, ExistingContact>(
    (existing ?? []).map((c: ExistingContact) => [c.email.toLowerCase(), c])
  )

  type ContactRow = {
    email: string
    first_name: string
    last_name: string
    source: 'registration' | 'membership'
  }
  const toUpsert: ContactRow[] = []

  for (const reg of regResult.data ?? []) {
    const email = reg.email.trim().toLowerCase()
    const cur = existingMap.get(email)
    if (cur?.unsubscribed) continue // never re-add an unsubscribed contact
    toUpsert.push({
      email,
      first_name: cur?.first_name || reg.first_name || '',
      last_name:  cur?.last_name  || reg.surname    || '',
      source: 'registration',
    })
  }

  for (const mem of memResult.data ?? []) {
    const email = mem.email.trim().toLowerCase()
    const cur = existingMap.get(email)
    if (cur?.unsubscribed) continue
    // Only add if not already going in from registrations
    if (!toUpsert.find(r => r.email === email)) {
      toUpsert.push({
        email,
        first_name: cur?.first_name || '',
        last_name:  cur?.last_name  || '',
        source: 'membership',
      })
    }
  }

  if (toUpsert.length === 0) {
    return NextResponse.json({ added: 0, updated: 0, skipped: 0 })
  }

  const { data: upserted, error } = await service
    .from('mailing_list_contacts')
    .upsert(toUpsert, { onConflict: 'email', ignoreDuplicates: false })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const added   = (upserted ?? []).filter((r: { created_at: string }) => {
    const age = Date.now() - new Date(r.created_at).getTime()
    return age < 10_000 // created in last 10s
  }).length
  const updated = (upserted ?? []).length - added

  return NextResponse.json({ added, updated, skipped: toUpsert.length - (upserted ?? []).length })
}
