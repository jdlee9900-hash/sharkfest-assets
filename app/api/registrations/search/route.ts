import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { getEvent } from '@/lib/events'
import { isActiveMember } from '@/lib/membership'

// Typeahead for the "camp near" picker on the registration form. Returns a
// minimal directory (id + display name) of people already registered for the
// same event, so a registrant can nominate who they'd like to be pitched near.
// Deliberately minimal — no contact details are exposed.
export async function GET(request: Request) {
  const limit = rateLimit(`reg-search:${clientIp(request)}`, 40, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests — please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  const url = new URL(request.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const event = getEvent(url.searchParams.get('year'))

  // Need at least two characters to search — avoids dumping the whole list.
  if (q.length < 2) return NextResponse.json({ results: [] })

  // Mirror the page gating: a members-only event's directory is members-only too.
  if (event.membersOnly) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !(await isActiveMember(user.id))) {
      return NextResponse.json({ error: 'Members only' }, { status: 403 })
    }
  }

  // Escape PostgREST `or` filter wildcards/commas in the user's query.
  const safe = q.replace(/[%,()]/g, ' ')

  const service = createServiceClient()
  const { data, error } = await service
    .from('registrations')
    .select('id, first_name, surname')
    .eq('year', event.year)
    .or(`first_name.ilike.%${safe}%,surname.ilike.%${safe}%`)
    .order('first_name', { ascending: true })
    .limit(10)

  if (error) {
    console.error('[reg-search] error:', error)
    return NextResponse.json({ results: [] })
  }

  const results = (data ?? []).map(r => ({
    id: r.id,
    name: `${r.first_name} ${r.surname}`.trim(),
  }))

  return NextResponse.json({ results })
}
