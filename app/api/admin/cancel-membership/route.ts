import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'
import { isSyntheticSubscription } from '@/lib/membership'

// Terminate a member's membership from the admin portal.
//  - Paid Stripe subscriptions are set to cancel at the end of the period they've
//    already paid for (cancel_at_period_end). The customer.subscription.updated /
//    .deleted webhooks then sync the row and send the cancellation email.
//  - Comp / community memberships have no real Stripe subscription, so they're just
//    marked canceled in the DB (mirrors the comp-revoke path).
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails().includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const membershipId = typeof body?.membership_id === 'string' ? body.membership_id.trim() : ''
  if (!membershipId) return NextResponse.json({ error: 'membership_id is required' }, { status: 400 })

  const service = createServiceClient()
  const { data: membership } = await service
    .from('memberships')
    .select('id, user_id, status, stripe_subscription_id, current_period_end')
    .eq('id', membershipId)
    .maybeSingle()
  if (!membership) return NextResponse.json({ error: 'Membership not found' }, { status: 404 })

  if (membership.status === 'canceled') {
    return NextResponse.json({ ok: true, kind: 'noop' })
  }

  // Comp / community membership — no Stripe billing to stop.
  if (isSyntheticSubscription(membership.stripe_subscription_id)) {
    await service
      .from('memberships')
      .update({ status: 'canceled', cancel_at_period_end: false, updated_at: new Date().toISOString() })
      .eq('id', membership.id)
    if (membership.user_id) {
      await service.from('registrations').update({ is_member: false }).eq('user_id', membership.user_id)
    }
    return NextResponse.json({ ok: true, kind: 'comp' })
  }

  // Paid Stripe subscription — cancel at period end so they keep what they've paid for.
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })

  try {
    const stripe = new Stripe(stripeKey)
    await stripe.subscriptions.update(membership.stripe_subscription_id, { cancel_at_period_end: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not cancel the Stripe subscription'
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // Optimistic update for instant UI feedback — the webhook will also sync this.
  await service
    .from('memberships')
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq('id', membership.id)

  return NextResponse.json({ ok: true, kind: 'stripe', endsAt: membership.current_period_end })
}
