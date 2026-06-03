export type AccommodationType = 'Tent' | 'Caravan' | 'Mobile Home' | 'Campervan'
export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlist' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface Registration {
  id: string
  first_name: string
  surname: string
  email: string
  mobile: string
  adults: number
  kids: number
  accommodation: AccommodationType
  electric_hookup: boolean
  vehicle_reg: string | null
  notes: string | null
  year: number
  status: RegistrationStatus
  admin_notes: string | null
  user_id: string | null
  camp_near_1: string | null
  camp_near_2: string | null
  payment_method: 'full' | 'instalments' | null
  created_at: string
}

export interface PaymentPlan {
  id: string
  registration_id: string
  total_amount: number
  notes: string | null
  allocated_by: string | null
  allocated_at: string
  member_discount: number | null
  member_discount_pct: number | null
}

export interface Instalment {
  id: string
  payment_plan_id: string
  registration_id: string
  label: string
  amount: number
  due_date: string | null
}

export interface Payment {
  id: string
  registration_id: string
  user_id: string | null
  instalment_id: string | null
  amount: number
  status: PaymentStatus
  stripe_payment_intent_id: string | null
  stripe_session_id: string | null
  paid_at: string | null
  created_at: string
}

export type MemberPlan = 'individual' | 'family' | 'community'

// Membership tiers. Paid tiers have a Stripe price; the community tier is free.
// Client-safe (no server imports).
export const MEMBERSHIP_TIERS: { id: MemberPlan; label: string; tagline: string; free?: boolean }[] = [
  { id: 'individual', label: 'Individual or Couple', tagline: 'For you — or you and a partner. Add a second login to share your booking.' },
  { id: 'family',     label: 'Family',               tagline: 'For the whole family. Add a second login to share your booking.' },
  { id: 'community',  label: 'Community Member',     tagline: 'Stay connected to Torbay Sharks RFC all year round. No payment required.', free: true },
]

/** Human label for a stored plan value (handles legacy monthly/annual rows). */
export function planLabel(plan: string): string {
  switch (plan) {
    case 'individual': return 'Individual or Couple'
    case 'family':     return 'Family'
    case 'community':  return 'Community Member'
    case 'monthly':    return 'Monthly'
    case 'annual':     return 'Annual'
    default:           return 'Member'
  }
}
export type MembershipStatus = 'active' | 'past_due' | 'canceled' | 'incomplete'
export type MemberPostKind = 'news' | 'event'
export type RsvpResponse = 'going' | 'not_going'

export interface EventRsvp {
  id: string
  event_id: string
  user_id: string
  email: string
  name: string | null
  response: RsvpResponse
  adults: number
  kids: number
  note: string | null
  created_at: string
  updated_at: string
}

export interface Membership {
  id: string
  user_id: string
  email: string
  stripe_customer_id: string
  stripe_subscription_id: string
  stripe_price_id: string | null
  plan: MemberPlan
  status: MembershipStatus
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface MemberPost {
  id: string
  kind: MemberPostKind
  title: string
  summary: string | null
  body: string
  cover_public_id: string | null
  event_at: string | null
  event_end: string | null
  location: string | null
  published: boolean
  author: string | null
  created_at: string
}

export function formatAmount(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
}
