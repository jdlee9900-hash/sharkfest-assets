import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails().includes(user.email!)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const kind = body?.kind === 'event' ? 'event' : 'news'
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 200) : ''
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const text = typeof body?.body === 'string' ? body.body.slice(0, 10000) : ''
  const summary = typeof body?.summary === 'string' && body.summary.trim()
    ? body.summary.trim().slice(0, 500) : null
  const cover = typeof body?.cover_public_id === 'string' && body.cover_public_id.trim()
    ? body.cover_public_id.trim().slice(0, 300) : null
  const location = typeof body?.location === 'string' && body.location.trim()
    ? body.location.trim().slice(0, 200) : null

  // Validate event dates if supplied.
  let eventAt: string | null = null
  let eventEnd: string | null = null
  if (kind === 'event' && body?.event_at) {
    const d = new Date(body.event_at)
    if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid event date' }, { status: 400 })
    eventAt = d.toISOString()
  }
  if (kind === 'event' && body?.event_end) {
    const d = new Date(body.event_end)
    if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid event end date' }, { status: 400 })
    eventEnd = d.toISOString()
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('member_posts')
    .insert({
      kind,
      title,
      summary,
      body: text,
      cover_public_id: cover,
      event_at: eventAt,
      event_end: eventEnd,
      location,
      published: body?.published === false ? false : true,
      author: user.email,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
