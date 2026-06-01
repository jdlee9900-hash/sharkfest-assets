import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit, clientIp } from '@/lib/rate-limit'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Lets a registrant update the "camp near" people on their own booking after the
// fact — useful for early bookers who had no one to choose from at sign-up.
export async function POST(request: Request) {
  const limit = rateLimit(`camp-near:${clientIp(request)}`, 20, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests — please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const campNear = body?.camp_near

  const service = createServiceClient()

  // The booking we're editing must belong to the signed-in user.
  const { data: reg } = await service
    .from('registrations')
    .select('id, year')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!reg) return NextResponse.json({ error: 'No booking found for your account.' }, { status: 404 })

  // Keep only valid uuids, drop self, dedupe, cap at two.
  const requested = Array.isArray(campNear)
    ? [...new Set(
        campNear.filter((v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v) && v !== reg.id)
      )].slice(0, 2)
    : []

  // Confirm each chosen id is a real registration for the same event, and grab names.
  let valid: { id: string; name: string }[] = []
  if (requested.length > 0) {
    const { data: matches } = await service
      .from('registrations')
      .select('id, first_name, surname')
      .eq('year', reg.year)
      .in('id', requested)
    valid = requested
      .map(id => {
        const m = (matches ?? []).find(x => x.id === id)
        return m ? { id, name: `${m.first_name} ${m.surname}`.trim() } : null
      })
      .filter((x): x is { id: string; name: string } => x !== null)
  }

  const { error } = await service
    .from('registrations')
    .update({ camp_near_1: valid[0]?.id ?? null, camp_near_2: valid[1]?.id ?? null })
    .eq('id', reg.id)

  if (error) {
    console.error('[camp-near] update failed:', error)
    return NextResponse.json({ error: 'Could not save your changes — please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, camp_near: valid })
}
