import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails().includes(user.email ?? '')) return null
  return user
}

// Build the validated column set shared by create (POST) and edit (PATCH).
function parsePostFields(body: Record<string, unknown>): { fields: Record<string, unknown> } | { error: string } {
  const kind = body?.kind === 'event' ? 'event' : 'news'
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 200) : ''
  if (!title) return { error: 'Title is required' }

  const text = typeof body?.body === 'string' ? (body.body as string).slice(0, 10000) : ''
  const summary = typeof body?.summary === 'string' && body.summary.trim()
    ? (body.summary as string).trim().slice(0, 500) : null
  const cover = typeof body?.cover_public_id === 'string' && (body.cover_public_id as string).trim()
    ? (body.cover_public_id as string).trim().slice(0, 300) : null
  const location = typeof body?.location === 'string' && (body.location as string).trim()
    ? (body.location as string).trim().slice(0, 200) : null

  let eventAt: string | null = null
  let eventEnd: string | null = null
  if (kind === 'event' && body?.event_at) {
    const d = new Date(body.event_at as string)
    if (isNaN(d.getTime())) return { error: 'Invalid event date' }
    eventAt = d.toISOString()
  }
  if (kind === 'event' && body?.event_end) {
    const d = new Date(body.event_end as string)
    if (isNaN(d.getTime())) return { error: 'Invalid event end date' }
    eventEnd = d.toISOString()
  }

  return {
    fields: {
      kind,
      title,
      summary,
      body: text,
      cover_public_id: cover,
      event_at: eventAt,
      event_end: eventEnd,
      location,
      published: body?.published === false ? false : true,
    },
  }
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const parsed = parsePostFields(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('member_posts')
    .insert({ ...parsed.fields, author: user.email })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}

export async function PATCH(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'Missing post id' }, { status: 400 })

  const parsed = parsePostFields(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service.from('member_posts').update(parsed.fields).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id })
}

export async function DELETE(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') ?? ''
  if (!id) return NextResponse.json({ error: 'Missing post id' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service.from('member_posts').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
