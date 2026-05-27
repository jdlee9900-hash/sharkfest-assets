import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })

  const { instalment_id } = await request.json()
  if (!instalment_id) return NextResponse.json({ error: 'Missing instalment_id' }, { status: 400 })

  const service = createServiceClient()

  // Get the user's registration first
  const { data: registration } = await service
    .from('registrations')
    .select('id, email, first_name, surname')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!registration) {
    return NextResponse.json({ error: 'No registration found' }, { status: 404 })
  }

  // Verify the instalment belongs to this registration
  const { data: instalment, error: insErr } = await service
    .from('instalments')
    .select('*')
    .eq('id', instalment_id)
    .eq('registration_id', registration.id)
    .single()

  if (insErr || !instalment) {
    return NextResponse.json({ error: 'Instalment not found' }, { status: 404 })
  }

  // Check if already paid
  const { data: existingPayment } = await service
    .from('payments')
    .select('status')
    .eq('instalment_id', instalment_id)
    .eq('status', 'paid')
    .maybeSingle()

  if (existingPayment) {
    return NextResponse.json({ error: 'Already paid' }, { status: 409 })
  }

  const stripe = new Stripe(stripeKey)
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sharkfest.vercel.app'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'gbp',
        product_data: {
          name: `SharkFest 2028 — ${instalment.label}`,
          description: `Booking for ${registration.first_name} ${registration.surname}`,
        },
        unit_amount: instalment.amount,
      },
      quantity: 1,
    }],
    mode: 'payment',
    customer_email: registration.email,
    success_url: `${origin}/my-booking?payment=success`,
    cancel_url: `${origin}/my-booking?payment=cancelled`,
    metadata: {
      registration_id: instalment.registration_id,
      instalment_id: instalment.id,
      user_id: user.id,
    },
  })

  // Create a pending payment record
  await service.from('payments').insert({
    registration_id: instalment.registration_id,
    user_id: user.id,
    instalment_id: instalment.id,
    amount: instalment.amount,
    status: 'pending',
    stripe_session_id: session.id,
  })

  return NextResponse.json({ url: session.url })
}
