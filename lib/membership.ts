import { createServiceClient } from '@/lib/supabase/server'
import type { Membership, MemberPlan } from '@/lib/types'

// Stripe recurring price IDs are created in the Stripe dashboard and supplied via env.
// Falls back to the older monthly/annual env vars so nothing hard-breaks pre-setup.
export function memberPriceId(plan: MemberPlan): string | null {
  const id = plan === 'family'
    ? (process.env.STRIPE_PRICE_FAMILY ?? process.env.STRIPE_PRICE_ANNUAL)
    : (process.env.STRIPE_PRICE_INDIVIDUAL ?? process.env.STRIPE_PRICE_MONTHLY)
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
 * Stable, human-friendly membership number derived from the row id — e.g. TSRFC-3F9A2C.
 * Deterministic so it can be shown on the card and used for verification.
 */
export function membershipNumber(m: Pick<Membership, 'id'>): string {
  const hex = m.id.replace(/-/g, '').slice(0, 6).toUpperCase()
  return `TSRFC-${hex}`
}
