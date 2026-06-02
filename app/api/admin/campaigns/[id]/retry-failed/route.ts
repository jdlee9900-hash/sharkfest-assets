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

  // Reset failed → pending so send-batch picks them up
  const { error } = await service
    .from('campaign_sends')
    .update({ status: 'pending', error: null, sent_at: null })
    .eq('campaign_id', id)
    .eq('status', 'failed')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await service
    .from('email_campaigns')
    .update({ status: 'sending' })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
