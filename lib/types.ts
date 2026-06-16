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
  tickets: Record<string, { adults: number; kids: number }> | null
  food_preference: string | null
  food_preferences: { kind: 'adult' | 'child'; choice: string }[] | null
  estimated_total: number | null
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

// Current paid tiers plus legacy keys kept valid for existing membership rows.
export type MemberPlan =
  | 'playing' | 'social_family' | 'social_single'
  | 'individual' | 'family' | 'community'

// Membership tiers paid by monthly standing order / card. Prices are configured
// in the admin Pricing page (and must match the Stripe recurring prices).
// Client-safe (no server imports).
export const MEMBERSHIP_TIERS: { id: MemberPlan; label: string; tagline: string; perks: string[]; free?: boolean }[] = [
  {
    id: 'playing',
    label: 'Playing Sharks Member',
    tagline: "For playing members — includes the player's family / partner.",
    perks: [
      'Membership for a playing Shark, their family & partner',
      'SharkFest 2027 registration — members only',
      'Member discount applied to your booking',
      'First access when 2027 signups open',
      'Members area, exclusive content & events',
      'Digital membership card · second login to share your booking',
    ],
  },
  {
    id: 'social_family',
    label: 'Non-Playing Social Family',
    tagline: 'Social family membership for non-playing supporters.',
    perks: [
      'Family membership for non-playing supporters',
      'SharkFest 2027 registration — members only',
      'Member discount applied to your booking',
      'Members area, exclusive content & events',
      'Digital membership card · second login to share your booking',
    ],
  },
  {
    id: 'social_single',
    label: 'Non-Playing Single Social',
    tagline: 'Single social membership for non-playing supporters.',
    perks: [
      'Single membership for a non-playing supporter',
      'SharkFest 2027 registration — members only',
      'Member discount applied to your booking',
      'Members area, exclusive content & events',
      'Digital membership card',
    ],
  },
]

/** Human label for a stored plan value (handles legacy rows). */
export function planLabel(plan: string): string {
  switch (plan) {
    case 'playing':       return 'Playing Sharks Member'
    case 'social_family': return 'Non-Playing Social Family'
    case 'social_single': return 'Non-Playing Single Social'
    case 'individual':    return 'Individual or Couple'
    case 'family':        return 'Family'
    case 'community':     return 'Community Member'
    case 'monthly':       return 'Monthly'
    case 'annual':        return 'Annual'
    default:              return 'Member'
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
