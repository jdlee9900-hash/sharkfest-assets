import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { upsertMembershipFromStripe } from '@/lib/membership'
import {
  sendEmail, getOrigin,
  emailPaymentReceipt,
  emailMembershipWelcome, emailMembershipPaymentFailed, emailMembershipCancelled,
} from '@/lib/email'
import type { MemberPlan } from '@/lib/types'

type Service = ReturnType<typeof createServiceClient>

// Best-effort first name for membership emails (no profiles table — derive from
// any registration the user owns, else the email local-part).
async function memberFirstName(service: Service, userId: string, email: string): Promise<string> {
  const { data } = await service
    .from('registrations').select('first_name').eq('user_id', userId).limit(1).maybeSingle()
  return data?.first_name || email.split('@')[0] || 'there'
}

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

  // ── checkout.session.completed — branch by mode ────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.mode === 'subscription') {
      // Membership new-signup path
      if (!session.subscription) return NextResponse.json({ ok: true })
      const service = createServiceClient()
      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      const email = session.customer_details?.email ?? session.customer_email ?? ''
      await upsertMembershipFromStripe(sub, email)
      try {
        const userId = sub.metadata?.user_id
        if (userId && email) {
          const firstName = await memberFirstName(service, userId, email)
          const plan: MemberPlan = (sub.metadata?.plan as MemberPlan) ?? 'individual'
          await sendEmail(email, 'Welcome to the club — SharkFest membership', emailMembershipWelcome({ first_name: firstName }, plan, getOrigin()))
        }
      } catch (err) {
        console.error('[email] membership welcome failed:', err)
      }
      return NextResponse.json({ ok: true })
    }

    // mode === 'payment' — one-time festival payment
    const { registration_id, instalment_id } = session.metadata ?? {}
    if (!registration_id) return NextResponse.json({ ok: true })

    const service = createServiceClient()

    if (instalment_id) {
      // Upsert so Stripe webhook retries are idempotent — requires the
      // UNIQUE constraint on payments.stripe_session_id (migration 0009).
      await service.from('payments').upsert({
        registration_id,
        instalment_id,
        amount: session.amount_total ?? 0,
        status: 'paid',
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        paid_at: new Date().toISOString(),
      }, { onConflict: 'stripe_session_id' })
    } else {
      // Flat amount payment — update the pending record created at checkout.
      await service
        .from('payments')
        .update({
          status: 'paid',
          stripe_payment_intent_id: session.payment_intent as string,
          paid_at: new Date().toISOString(),
        })
        .eq('stripe_session_id', session.id)
    }

    try {
      const [regRes, planRes, paidRes] = await Promise.all([
        service.from('registrations').select('first_name, email').eq('id', registration_id).single(),
        service.from('payment_plans').select('total_amount').eq('registration_id', registration_id).maybeSingle(),
        service.from('payments').select('amount').eq('registration_id', registration_id).eq('status', 'paid'),
      ])
      if (regRes.data) {
        const totalPaid   = (paidRes.data ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)
        const outstanding = planRes.data ? planRes.data.total_amount - totalPaid : 0
        await sendEmail(
          regRes.data.email,
          'Payment confirmed — SharkFest 2027',
          emailPaymentReceipt(regRes.data, session.amount_total ?? 0, new Date().toISOString(), outstanding, getOrigin())
        )
      }
    } catch (err) {
      console.error('[email] payment receipt failed:', err)
    }

    return NextResponse.json({ ok: true })
  }

  // ── Membership subscription lifecycle ──────────────────────────────────────
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const service = createServiceClient()
    const { data: row } = await service
      .from('memberships').select('email').eq('stripe_subscription_id', sub.id).maybeSingle()
    let email = row?.email ?? ''
    if (!email) {
      const cust = await stripe.customers.retrieve(sub.customer as string)
      if (!('deleted' in cust)) email = cust.email ?? ''
    }
    await upsertMembershipFromStripe(sub, email)

    if (event.type === 'customer.subscription.deleted' && sub.metadata?.user_id && email) {
      try {
        const firstName = await memberFirstName(service, sub.metadata.user_id, email)
        await sendEmail(email, 'Your SharkFest membership has ended', emailMembershipCancelled({ first_name: firstName }, getOrigin()))
      } catch (err) {
        console.error('[email] membership cancelled failed:', err)
      }
    }
    return NextResponse.json({ ok: true })
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const subId = (invoice as Stripe.Invoice & { subscription?: string | null }).subscription
    if (subId) {
      const service = createServiceClient()
      const { data: row } = await service
        .from('memberships').select('user_id, email').eq('stripe_subscription_id', subId).maybeSingle()
      await service.from('memberships').update({ status: 'past_due', updated_at: new Date().toISOString() }).eq('stripe_subscription_id', subId)
      if (row?.email && row.user_id) {
        try {
          const firstName = await memberFirstName(service, row.user_id, row.email)
          await sendEmail(row.email, 'Action needed — SharkFest membership payment', emailMembershipPaymentFailed({ first_name: firstName }, getOrigin()))
        } catch (err) {
          console.error('[email] membership payment-failed notice failed:', err)
        }
      }
    }
    return NextResponse.json({ ok: true })
  }

  // ── Payment session expired ────────────────────────────────────────────────
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.id) {
      const service = createServiceClient()
      await service
        .from('payments')
        .update({ status: 'failed' })
        .eq('stripe_session_id', session.id)
        .eq('status', 'pending')
    }
    return NextResponse.json({ ok: true })
  }

  // ── Payment intent failed (card declined mid-checkout) ────────────────────
  // Matches any pending payment record that already has the PI ID stored from
  // a previous webhook. Newly-pending records (no PI ID yet) are handled when
  // the checkout session expires above.
  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    const service = createServiceClient()
    await service
      .from('payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', pi.id)
      .eq('status', 'pending')
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
