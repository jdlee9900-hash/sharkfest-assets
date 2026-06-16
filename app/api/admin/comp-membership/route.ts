import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'
import type { MemberPlan } from '@/lib/types'

// stripe_subscription_id prefixed 'comp_' is the canonical signal that a membership
// was granted by an admin rather than created through Stripe. stripe_customer_id may
// now hold a real Stripe customer ID even for comp members so festival payments work.
const COMP_SUB_PREFIX = 'comp_'

const REAL_STRIPE_CUSTOMER = /^cus_[A-Za-z0-9]{10,}$/

// Find an auth user by email (Supabase has no direct lookup-by-email, so page through).
async function findUserByEmail(service: ReturnType<typeof createServiceClient>, email: string) {
  const target = email.toLowerCase()
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users?.length) break
    const match = data.users.find(u => (u.email ?? '').toLowerCase() === target)
    if (match) return match
    if (data.users.length < 200) break
  }
  return null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails().includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const action: 'grant' | 'revoke' = body?.action === 'revoke' ? 'revoke' : 'grant'
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const service = createServiceClient()
  const target = await findUserByEmail(service, email)
  if (!target) {
    return NextResponse.json(
      { error: 'No account found for that email. Ask them to log in once first, then try again.' },
      { status: 404 }
    )
  }

  if (action === 'revoke') {
    // Only ever touch comped memberships — never cancel a real Stripe subscription
    // from here (that would drift from Stripe). Direct those to the billing portal.
    const { data: existing } = await service
      .from('memberships').select('id, stripe_subscription_id').eq('user_id', target.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!existing) return NextResponse.json({ error: 'That user has no membership' }, { status: 404 })
    if (!existing.stripe_subscription_id?.startsWith(COMP_SUB_PREFIX)) {
      return NextResponse.json({ error: 'This is a paid Stripe membership — cancel it via the Stripe dashboard.' }, { status: 409 })
    }
    await service.from('memberships').update({ status: 'canceled', updated_at: new Date().toISOString() }).eq('id', existing.id)
    await service.from('registrations').update({ is_member: false }).eq('user_id', target.id)
    return NextResponse.json({ ok: true, action: 'revoke' })
  }

  // Grant: don't override an active paid membership.
  const { data: current } = await service
    .from('memberships').select('id, status, stripe_subscription_id, stripe_customer_id').eq('user_id', target.id)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (current && !current.stripe_subscription_id?.startsWith(COMP_SUB_PREFIX) && (current.status === 'active' || current.status === 'past_due')) {
    return NextResponse.json({ error: 'That user already has an active paid membership' }, { status: 409 })
  }

  // Reuse existing Stripe customer ID if the row already has one (e.g. re-granting after a revoke).
  // Otherwise try to create a new Stripe customer so festival payments work out of the box.
  let stripeCustomerId: string = 'comp'
  const existingCustomerId = current?.stripe_customer_id
  if (existingCustomerId && REAL_STRIPE_CUSTOMER.test(existingCustomerId)) {
    stripeCustomerId = existingCustomerId
  } else {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (stripeKey) {
      try {
        const stripe = new Stripe(stripeKey)
        const customer = await stripe.customers.create({
          email: target.email ?? email,
          metadata: { user_id: target.id },
        })
        stripeCustomerId = customer.id
      } catch {
        // Non-fatal — fall back to sentinel so the grant still succeeds
      }
    }
  }

  const COMP_PLANS: MemberPlan[] = ['playing', 'social_family', 'social_single']
  const plan: MemberPlan = COMP_PLANS.includes(body?.plan) ? body.plan : 'playing'
  // Far-future period so the gate treats it as active; one comp row per user.
  const periodEnd = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
  await service.from('memberships').upsert({
    user_id: target.id,
    email: target.email ?? email,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: `${COMP_SUB_PREFIX}${target.id}`,
    stripe_price_id: null,
    plan,
    status: 'active',
    current_period_end: periodEnd,
    cancel_at_period_end: false,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' })

  await service.from('registrations').update({ is_member: true }).eq('user_id', target.id)
  return NextResponse.json({ ok: true, action: 'grant' })
}
