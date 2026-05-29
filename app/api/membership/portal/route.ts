import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/membership'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })

  const membership = await getActiveMembership(user.id)
  if (!membership) return NextResponse.json({ error: 'No active membership' }, { status: 403 })

  const stripe = new Stripe(stripeKey)
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sharkfest.vercel.app'

  const session = await stripe.billingPortal.sessions.create({
    customer: membership.stripe_customer_id,
    return_url: `${origin}/members`,
  })

  return NextResponse.json({ url: session.url })
}
