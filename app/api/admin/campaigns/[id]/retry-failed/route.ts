import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/admin'

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
