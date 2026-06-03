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

  const { data, error } = await service
    .from('campaign_sends')
    .select('id, contact_id, error, sent_at')
    .eq('campaign_id', id)
    .eq('status', 'failed')
    .order('sent_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch emails for the failed contact IDs
  const contactIds = (data ?? []).map((r: { contact_id: string }) => r.contact_id)
  const { data: contacts } = contactIds.length
    ? await service
        .from('mailing_list_contacts')
        .select('id, email')
        .in('id', contactIds)
    : { data: [] }

  const emailMap = new Map(
    (contacts ?? []).map((c: { id: string; email: string }) => [c.id, c.email])
  )

  const rows = (data ?? []).map((r: { id: string; contact_id: string; error: string | null; sent_at: string | null }) => ({
    id: r.id,
    email: emailMap.get(r.contact_id) ?? r.contact_id,
    error: r.error ?? 'Unknown error',
    sent_at: r.sent_at,
  }))

  return NextResponse.json({ rows })
}
