import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type { Membership, MemberPlan, MembershipStatus } from '@/lib/types'

// stripe_subscription_id prefixes mark memberships that have no real Stripe
// subscription behind them: 'comp_' = admin-granted, 'community_' = free tier.
export const COMP_SUB_PREFIX = 'comp_'
export const COMMUNITY_SUB_PREFIX = 'community_'

/** True for admin-comped / free-community memberships that have no real Stripe subscription. */
export function isSyntheticSubscription(subId: string | null | undefined): boolean {
  return !!subId && (subId.startsWith(COMP_SUB_PREFIX) || subId.startsWith(COMMUNITY_SUB_PREFIX))
}

// Stripe recurring price IDs are created in the Stripe dashboard and supplied via env.
// Each paid tier has its own price; legacy env vars are used as fallbacks so nothing
// hard-breaks pre-setup. The displayed price comes from the admin Pricing page, but
// the actual amount charged is whatever these Stripe prices are set to.
export function memberPriceId(plan: MemberPlan): string | null {
  let id: string | undefined
  switch (plan) {
    case 'playing':
    case 'family':
      id = process.env.STRIPE_PRICE_PLAYING ?? process.env.STRIPE_PRICE_FAMILY ?? process.env.STRIPE_PRICE_ANNUAL
      break
    case 'social_family':
      id = process.env.STRIPE_PRICE_SOCIAL_FAMILY ?? process.env.STRIPE_PRICE_FAMILY ?? process.env.STRIPE_PRICE_ANNUAL
      break
    case 'social_single':
    case 'individual':
    default:
      id = process.env.STRIPE_PRICE_SOCIAL_SINGLE ?? process.env.STRIPE_PRICE_INDIVIDUAL ?? process.env.STRIPE_PRICE_MONTHLY
      break
  }
  return id?.trim() || null
}

/** Discount (%) members get on festival registration/tickets. Configurable; default 10. */
export function memberDiscountPercent(): number {
  const raw = Number(process.env.MEMBER_DISCOUNT_PERCENT)
  if (!Number.isFinite(raw) || raw < 0 || raw > 90) return 10
  return Math.round(raw)
}

/** Apply the member discount to a pence amount, rounded to whole pence. */
export function memberPrice(pence: number, percent = memberDiscountPercent()): number {
  return Math.round(pence * (1 - percent / 100))
}

/** Active membership row for a user, or null. Treats active and past_due as still valid. */
export async function getActiveMembership(userId: string): Promise<Membership | null> {
  const service = createServiceClient()
  const { data } = await service
    .from('memberships')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  // Guard against a stale 'active' row whose period has lapsed without a webhook.
  if (data.current_period_end && new Date(data.current_period_end).getTime() < Date.now()) {
    return null
  }
  return data as Membership
}

export async function isActiveMember(userId: string): Promise<boolean> {
  return (await getActiveMembership(userId)) !== null
}

/**
 * Active membership for a user, or, if this user is a partner on a booking,
 * the primary registrant's membership. Partners share the primary's membership.
 */
export async function getMembershipOrPartnerMembership(userId: string): Promise<Membership | null> {
  const own = await getActiveMembership(userId)
  if (own) return own

  const service = createServiceClient()
  const { data: partnerReg } = await service
    .from('registrations')
    .select('user_id')
    .eq('partner_user_id', userId)
    .not('user_id', 'is', null)
    .limit(1)
    .maybeSingle()

  if (!partnerReg?.user_id) return null
  return getActiveMembership(partnerReg.user_id as string)
}

export async function isActiveMemberOrPartner(userId: string): Promise<boolean> {
  return (await getMembershipOrPartnerMembership(userId)) !== null
}

/**
 * Stable, human-friendly membership number derived from the row id — e.g. TSRFC-3F9A2C.
 * Deterministic so it can be shown on the card and used for verification.
 */
export function membershipNumber(m: Pick<Membership, 'id'>): string {
  const hex = m.id.replace(/-/g, '').slice(0, 6).toUpperCase()
  return `TSRFC-${hex}`
}

/**
 * Create a free community membership. Registers the user as a Stripe customer
 * (so payments can be attached later) but creates no subscription.
 * Does NOT set is_member on registrations — community members get no festival discount.
 */
export async function createCommunityMembership(userId: string, email: string): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY
  const service = createServiceClient()

  // Reuse an existing Stripe customer if one was created for a prior membership.
  const { data: prior } = await service
    .from('memberships')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let customerId = prior?.stripe_customer_id as string | undefined
  if (!customerId && key) {
    const stripe = new Stripe(key)
    const customer = await stripe.customers.create({
      email,
      metadata: { user_id: userId },
    })
    customerId = customer.id
  }

  await service.from('memberships').upsert({
    user_id: userId,
    email,
    stripe_customer_id: customerId ?? `community_cus_${userId}`,
    stripe_subscription_id: `community_${userId}`,
    stripe_price_id: null,
    plan: 'community',
    status: 'active',
    current_period_end: null,
    cancel_at_period_end: false,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' })
}

// ── Stripe subscription → membership row ──────────────────────────────────────

/** Map Stripe's subscription status to our narrower set. */
export function mapSubStatus(s: Stripe.Subscription.Status): MembershipStatus {
  switch (s) {
    case 'active':
    case 'trialing':   return 'active'
    case 'past_due':
    case 'unpaid':
    case 'paused':     return 'past_due'
    case 'incomplete': return 'incomplete'
    default:           return 'canceled' // canceled, incomplete_expired
  }
}

/**
 * Upsert a membership row from a Stripe subscription (idempotent on subscription
 * id). Shared by the webhook and the post-checkout reconcile path so both write
 * the row identically.
 */
export async function upsertMembershipFromStripe(sub: Stripe.Subscription, email: string): Promise<void> {
  const userId = sub.metadata?.user_id
  if (!userId) return
  const service = createServiceClient()
  const priceId = sub.items.data[0]?.price.id ?? null
  const periodEnd = sub.items.data[0]?.current_period_end ?? null
  // Checkout always stamps the plan in metadata; fall back to inferring from the
  // price id for legacy/manual subscriptions.
  const inferPlan = (): MemberPlan => {
    if (priceId && priceId === memberPriceId('playing')) return 'playing'
    if (priceId && priceId === memberPriceId('social_family')) return 'social_family'
    return 'social_single'
  }
  const plan: MemberPlan = (sub.metadata?.plan as MemberPlan) ?? inferPlan()

  await service.from('memberships').upsert({
    user_id: userId,
    email,
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceId,
    plan,
    status: mapSubStatus(sub.status),
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' })

  // Flag the user's registrations as member-owned (for admin visibility + pricing).
  const status = mapSubStatus(sub.status)
  const active = status === 'active' || status === 'past_due'
  await service.from('registrations').update({ is_member: active }).eq('user_id', userId)
}

/**
 * Reconcile a just-completed Checkout Session straight from Stripe, in case the
 * webhook hasn't landed yet by the time the customer is redirected back. Verifies
 * the session belongs to this user and is paid before writing the membership row.
 * Returns the resulting active membership, or null if it can't be confirmed.
 */
export async function reconcileCheckoutSession(sessionId: string, userId: string): Promise<Membership | null> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || !sessionId) return null
  const stripe = new Stripe(key)

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    return null
  }

  // Must be this user's own paid subscription checkout — never trust the id blindly.
  if (session.metadata?.user_id !== userId) return null
  if (session.mode !== 'subscription' || !session.subscription) return null
  if (session.status !== 'complete' && session.payment_status !== 'paid') return null

  try {
    const sub = await stripe.subscriptions.retrieve(session.subscription as string)
    const email = session.customer_details?.email ?? session.customer_email ?? ''
    await upsertMembershipFromStripe(sub, email)
  } catch {
    return null
  }

  return getActiveMembership(userId)
}
