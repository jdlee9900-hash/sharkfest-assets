import { type NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails().includes(user.email ?? '')) return null
  return user
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const service = createServiceClient()

  const { data: campaign } = await service
    .from('email_campaigns')
    .select('status')
    .eq('id', id)
    .single()

  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['draft', 'partial'].includes(campaign.status)) {
    return NextResponse.json({ error: 'Campaign already prepared or sent' }, { status: 400 })
  }

  // Get all active (subscribed) contacts
  const { data: contacts, error: cErr } = await service
    .from('mailing_list_contacts')
    .select('id')
    .eq('unsubscribed', false)

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  const allContactIds = (contacts ?? []).map((c: { id: string }) => c.id)

  // Get contacts that already have a send record for this campaign
  const { data: existing } = await service
    .from('campaign_sends')
    .select('contact_id')
    .eq('campaign_id', id)

  const existingSet = new Set((existing ?? []).map((s: { contact_id: string }) => s.contact_id))
  const toInsert = allContactIds
    .filter((cid: string) => !existingSet.has(cid))
    .map((contact_id: string) => ({ campaign_id: id, contact_id, status: 'pending' }))

  if (toInsert.length > 0) {
    const { error: iErr } = await service.from('campaign_sends').insert(toInsert)
    if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 })
  }

  const totalCount = allContactIds.length

  await service
    .from('email_campaigns')
    .update({ status: 'sending', total_count: totalCount })
    .eq('id', id)

  return NextResponse.json({ prepared: toInsert.length, total: totalCount })
}
