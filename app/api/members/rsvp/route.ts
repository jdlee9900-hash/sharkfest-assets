import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/membership'
import type { RsvpResponse } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Only active members can RSVP to member events.
  const membership = await getActiveMembership(user.id)
  if (!membership) return NextResponse.json({ error: 'Members only' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const eventId = typeof body?.event_id === 'string' ? body.event_id : ''
  if (!eventId) return NextResponse.json({ error: 'Missing event' }, { status: 400 })

  const response: RsvpResponse = body?.response === 'not_going' ? 'not_going' : 'going'

  // Clamp counts to the same bounds as the DB check constraints.
  const clamp = (n: unknown, min: number, max: number, fallback: number) => {
    const v = Math.round(Number(n))
    return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
  }
  // "Going" implies at least one adult; "not going" zeroes the party out.
  const adults = response === 'going' ? clamp(body?.adults, 1, 50, 1) : 0
  const kids   = response === 'going' ? clamp(body?.kids,   0, 50, 0) : 0
  const note   = typeof body?.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 500) : null

  const service = createServiceClient()

  // Event must exist, be an event, and be published.
  const { data: event } = await service
    .from('member_posts')
    .select('id, published')
    .eq('id', eventId)
    .eq('kind', 'event')
    .maybeSingle()
  if (!event || !event.published) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Member name from their most recent registration, for the admin list.
  const { data: reg } = await service
    .from('registrations')
    .select('first_name, surname')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const name = reg ? `${reg.first_name} ${reg.surname}`.trim() : null

  const { error } = await service
    .from('event_rsvps')
    .upsert({
      event_id: eventId,
      user_id: user.id,
      email: user.email ?? membership.email,
      name,
      response,
      adults,
      kids,
      note,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'event_id,user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, response, adults, kids })
}
