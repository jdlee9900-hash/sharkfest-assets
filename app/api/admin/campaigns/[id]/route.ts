import { type NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails().includes(user.email ?? '')) return null
  return user
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const service = createServiceClient()
  const { data, error } = await service.from('email_campaigns').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ campaign: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { subject, body } = await req.json()

  const service = createServiceClient()

  // Only allow editing drafts
  const { data: existing } = await service
    .from('email_campaigns')
    .select('status')
    .eq('id', id)
    .single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft campaigns can be edited' }, { status: 400 })
  }

  const updates: Record<string, string> = {}
  if (subject !== undefined) updates.subject = subject.trim()
  if (body !== undefined) updates.body = body

  const { data, error } = await service
    .from('email_campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaign: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const service = createServiceClient()

  const { data: existing } = await service
    .from('email_campaigns')
    .select('status')
    .eq('id', id)
    .single()
  if (existing?.status === 'sending') {
    return NextResponse.json({ error: 'Cannot delete a campaign that is currently sending' }, { status: 400 })
  }

  const { error } = await service.from('email_campaigns').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
