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

export type MemberPlan = 'monthly' | 'annual'
export type MembershipStatus = 'active' | 'past_due' | 'canceled' | 'incomplete'
export type MemberPostKind = 'news' | 'event'

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
  body: string
  cover_public_id: string | null
  event_at: string | null
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
