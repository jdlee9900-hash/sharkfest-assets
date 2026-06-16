import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getActiveMembership, memberPriceId } from '@/lib/membership'
import type { MemberPlan } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const VALID_PLANS: MemberPlan[] = ['playing', 'social_family', 'social_single']
  const plan: MemberPlan = VALID_PLANS.includes(body?.plan) ? body.plan : 'social_single'

  // Map plan → price ID on the server; never trust a client-supplied price.
  const price = memberPriceId(plan)
  if (!price) return NextResponse.json({ error: 'Membership plan not configured' }, { status: 503 })

  // Block paid members from double-subscribing; allow community members to upgrade.
  const existing = await getActiveMembership(user.id)
  if (existing && existing.plan !== 'community') {
    return NextResponse.json({ error: 'You already have an active membership' }, { status: 409 })
  }

  const stripe = new Stripe(stripeKey)
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sharkfest.co.uk'

  // Reuse a Stripe customer if we've seen this user before (any membership row),
  // otherwise create one tagged with the Supabase user id.
  const service = createServiceClient()
  const { data: prior } = await service
    .from('memberships')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let customerId = prior?.stripe_customer_id as string | undefined
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    // session_id lets the members page reconcile straight from Stripe if it loads
    // before the webhook has written the membership row.
    success_url: `${origin}/members?welcome=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/join?status=cancelled`,
    metadata: { user_id: user.id, plan },
    subscription_data: { metadata: { user_id: user.id, plan } },
  })

  return NextResponse.json({ url: session.url })
}
