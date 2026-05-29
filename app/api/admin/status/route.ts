import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !adminEmails().includes(user.email!)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, status, admin_notes } = await request.json()
  const valid = ['pending', 'confirmed', 'waitlist', 'cancelled']
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (typeof id !== 'string' || !UUID_RE.test(id) || !valid.includes(status)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const safeNotes = admin_notes === undefined
    ? undefined
    : (typeof admin_notes === 'string' ? admin_notes.slice(0, 2000) : null)

  const service = createServiceClient()
  const { error } = await service
    .from('registrations')
    .update({ status, ...(safeNotes !== undefined ? { admin_notes: safeNotes } : {}) })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
