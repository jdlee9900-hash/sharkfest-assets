import { type NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getOrigin, sendEmail, buildCampaignEmail } from '@/lib/email'
import { adminEmails } from '@/lib/types'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails().includes(user.email ?? '')) return null
  return user
}

const BATCH_SIZE = 50

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const service = createServiceClient()

  // Load campaign
  const { data: campaign } = await service
    .from('email_campaigns')
    .select('subject, body, status')
    .eq('id', id)
    .single()

  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['sending', 'partial'].includes(campaign.status)) {
    return NextResponse.json({ error: 'Campaign is not in sending state. Call /prepare first.' }, { status: 400 })
  }

  // Get next batch of pending sends with contact details
  const { data: batch, error: bErr } = await service
    .from('campaign_sends')
    .select('id, contact_id, mailing_list_contacts(email, first_name, unsubscribe_token)')
    .eq('campaign_id', id)
    .eq('status', 'pending')
    .limit(BATCH_SIZE)

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 })

  const sends = batch ?? []
  const origin = getOrigin()
  let batchSent = 0
  let batchFailed = 0

  // Process sends concurrently in groups of 10
  type SendRow = {
    id: string
    contact_id: string
    mailing_list_contacts: { email: string; first_name: string; unsubscribe_token: string }[]
  }
  for (let i = 0; i < sends.length; i += 10) {
    const chunk = sends.slice(i, i + 10) as SendRow[]
    await Promise.allSettled(
      chunk.map(async (send) => {
        const contact = send.mailing_list_contacts?.[0] ?? null
        if (!contact) {
          await service
            .from('campaign_sends')
            .update({ status: 'failed', error: 'Contact not found', sent_at: new Date().toISOString() })
            .eq('id', send.id)
          batchFailed++
          return
        }

        const emailBody = buildCampaignEmail(campaign.body, contact, origin)
        try {
          await sendEmail(contact.email, campaign.subject, emailBody)
          await service
            .from('campaign_sends')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', send.id)
          batchSent++
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          await service
            .from('campaign_sends')
            .update({ status: 'failed', error: message, sent_at: new Date().toISOString() })
            .eq('id', send.id)
          batchFailed++
        }
      })
    )
  }

  // Get updated counts
  const { data: counts } = await service
    .from('campaign_sends')
    .select('status')
    .eq('campaign_id', id)

  const allSends = counts ?? []
  const sentCount   = allSends.filter((s: { status: string }) => s.status === 'sent').length
  const failedCount = allSends.filter((s: { status: string }) => s.status === 'failed').length
  const remaining   = allSends.filter((s: { status: string }) => s.status === 'pending').length

  const newStatus = remaining === 0
    ? (failedCount > 0 ? 'partial' : 'sent')
    : 'sending'

  await service
    .from('email_campaigns')
    .update({
      sent_count: sentCount,
      failed_count: failedCount,
      status: newStatus,
      ...(newStatus !== 'sending' ? { sent_at: new Date().toISOString() } : {}),
    })
    .eq('id', id)

  // Return cumulative totals (not per-batch) so the client can display running progress
  return NextResponse.json({ sent: sentCount, failed: failedCount, remaining })
}
