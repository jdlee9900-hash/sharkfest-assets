import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/membership'

const REAL_STRIPE_CUSTOMER = /^cus_[A-Za-z0-9]{10,}$/

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })

  const membership = await getActiveMembership(user.id)
  if (!membership) return NextResponse.json({ error: 'No active membership' }, { status: 403 })
  if (
    membership.stripe_subscription_id.startsWith('comp_') ||
    membership.stripe_subscription_id.startsWith('community_') ||
    !REAL_STRIPE_CUSTOMER.test(membership.stripe_customer_id)
  ) {
    return NextResponse.json({ error: 'This membership has no billing to manage' }, { status: 400 })
  }

  const stripe = new Stripe(stripeKey)
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sharkfest.co.uk'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: membership.stripe_customer_id,
      return_url: `${origin}/members`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Billing portal unavailable'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
