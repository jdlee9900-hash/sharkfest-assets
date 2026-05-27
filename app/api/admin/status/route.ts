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
  if (!id || !valid.includes(status)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('registrations')
    .update({ status, ...(admin_notes !== undefined ? { admin_notes } : {}) })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
