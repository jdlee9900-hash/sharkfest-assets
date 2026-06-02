import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/membership'

const REAL_STRIPE_CUSTOMER = /^cus_[A-Za-z0-9]{10,}$/

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })

  const body = await request.json()
  // instalment_id = paying a specific instalment (e.g. deposit)
  // amount = custom balance payment in pence
  const { instalment_id, amount: customAmountPence } = body

  if (!instalment_id && !customAmountPence) {
    return NextResponse.json({ error: 'Missing instalment_id or amount' }, { status: 400 })
  }

  const service = createServiceClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sharkfest.co.uk'

  // Get the user's registration
  const { data: registration } = await service
    .from('registrations')
    .select('id, email, first_name, surname')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!registration) {
    return NextResponse.json({ error: 'No registration found' }, { status: 404 })
  }

  const stripe = new Stripe(stripeKey)
  let amountPence: number
  let label: string

  if (instalment_id) {
    // Paying a specific instalment (deposit)
    const { data: instalment } = await service
      .from('instalments')
      .select('*')
      .eq('id', instalment_id)
      .eq('registration_id', registration.id)
      .single()

    if (!instalment) {
      return NextResponse.json({ error: 'Instalment not found' }, { status: 404 })
    }

    // Check not already paid
    const { data: alreadyPaid } = await service
      .from('payments')
      .select('id')
      .eq('instalment_id', instalment_id)
      .eq('status', 'paid')
      .maybeSingle()

    if (alreadyPaid) {
      return NextResponse.json({ error: 'Already paid' }, { status: 409 })
    }

    amountPence = instalment.amount
    label = instalment.label
  } else {
    // Custom balance payment — validate amount
    amountPence = Math.round(customAmountPence)
    if (amountPence < 100) {
      return NextResponse.json({ error: 'Minimum payment is £1' }, { status: 400 })
    }

    // Check remaining balance
    const { data: plan } = await service
      .from('payment_plans')
      .select('total_amount')
      .eq('registration_id', registration.id)
      .maybeSingle()

    if (plan) {
      const { data: paidRows } = await service
        .from('payments')
        .select('amount')
        .eq('registration_id', registration.id)
        .eq('status', 'paid')

      const totalPaid = (paidRows ?? []).reduce((s, p) => s + p.amount, 0)
      const remaining = plan.total_amount - totalPaid

      if (amountPence > remaining) {
        return NextResponse.json({ error: `Amount exceeds remaining balance of £${(remaining / 100).toFixed(2)}` }, { status: 400 })
      }
    }

    label = 'Balance payment'
  }

  // Use the member's existing Stripe customer if available so their card is pre-filled
  // and festival payments appear alongside their membership in the billing portal.
  const membership = await getActiveMembership(user.id)
  const memberCustomerId = membership && REAL_STRIPE_CUSTOMER.test(membership.stripe_customer_id)
    ? membership.stripe_customer_id
    : null

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'gbp',
        product_data: {
          name: `SharkFest 2027 — ${label}`,
          description: `${registration.first_name} ${registration.surname}`,
        },
        unit_amount: amountPence,
      },
      quantity: 1,
    }],
    mode: 'payment',
    ...(memberCustomerId ? { customer: memberCustomerId } : { customer_email: registration.email }),
    success_url: `${origin}/my-booking?payment=success`,
    cancel_url: `${origin}/my-booking?payment=cancelled`,
    metadata: {
      registration_id: registration.id,
      instalment_id: instalment_id ?? '',
      user_id: user.id,
    },
  })

  // Create pending payment record
  await service.from('payments').insert({
    registration_id: registration.id,
    user_id: user.id,
    instalment_id: instalment_id ?? null,
    amount: amountPence,
    status: 'pending',
    stripe_session_id: session.id,
  })

  return NextResponse.json({ url: session.url })
}
