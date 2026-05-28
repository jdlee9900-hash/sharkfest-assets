import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, emailPaymentReceipt, getOrigin } from '@/lib/email'

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  const stripe = new Stripe(stripeKey)
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err instanceof Error ? err.message : 'unknown'}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { registration_id, instalment_id } = session.metadata ?? {}

    if (!registration_id) return NextResponse.json({ ok: true })

    const service = createServiceClient()

    // Update payment record
    await service
      .from('payments')
      .update({
        status: 'paid',
        stripe_payment_intent_id: session.payment_intent as string,
        paid_at: new Date().toISOString(),
      })
      .eq('stripe_session_id', session.id)

    // If payment was for a specific instalment, upsert a paid record
    if (instalment_id) {
      const { data: existing } = await service
        .from('payments')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle()

      if (!existing) {
        await service.from('payments').insert({
          registration_id,
          instalment_id,
          amount: session.amount_total ?? 0,
          status: 'paid',
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          paid_at: new Date().toISOString(),
        })
      }
    }

    // Send payment receipt (non-blocking)
    ;(async () => {
      try {
        const [regRes, planRes, paidRes] = await Promise.all([
          service.from('registrations').select('first_name, email').eq('id', registration_id).single(),
          service.from('payment_plans').select('total_amount').eq('registration_id', registration_id).maybeSingle(),
          service.from('payments').select('amount').eq('registration_id', registration_id).eq('status', 'paid'),
        ])
        if (!regRes.data) return
        const totalPaid   = (paidRes.data ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)
        const outstanding = planRes.data ? planRes.data.total_amount - totalPaid : 0
        await sendEmail(
          regRes.data.email,
          'Payment confirmed — SharkFest 2028',
          emailPaymentReceipt(regRes.data, session.amount_total ?? 0, new Date().toISOString(), outstanding, getOrigin())
        )
      } catch { /* silent */ }
    })()
  }

  if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.id) {
      const service = createServiceClient()
      await service
        .from('payments')
        .update({ status: 'failed' })
        .eq('stripe_session_id', session.id)
        .eq('status', 'pending')
    }
  }

  return NextResponse.json({ ok: true })
}
