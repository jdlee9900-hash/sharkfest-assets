// Site pricing — membership tier prices (display) and SharkFest per-head fees.
// Client-safe: pure types, defaults and helpers only (no server imports), so it
// can be shared by the public pages, the booking form and the admin editor.
// The server-side reader/writer lives in `lib/pricing-server.ts`.

import type { MemberPlan } from '@/lib/types'

/** Monthly membership prices, in pence, keyed by the paid tier id. */
export interface MembershipPrices {
  playing: number
  social_family: number
  social_single: number
}

/** SharkFest per-head fees, in pence. */
export interface FestivalFees {
  full_adult: number
  full_kid: number
  camp_adult: number
  camp_kid: number
  day_adult: number
  day_kid: number
  committee_adult: number
  committee_kid: number
}

export interface SitePricing {
  membership: MembershipPrices
  festival: FestivalFees
  /** Food preference choices offered in the booking form. */
  foodOptions: string[]
}

export const DEFAULT_PRICING: SitePricing = {
  membership: { playing: 250, social_family: 150, social_single: 100 },
  festival: {
    full_adult: 14000, full_kid: 3000,
    camp_adult: 6000, camp_kid: 1000,
    day_adult: 3000, day_kid: 500,
    committee_adult: 7000, committee_kid: 0,
  },
  foodOptions: ['Meat Eater', 'Vegetarian', 'Gluten Free'],
}

// ── Booking ticket categories ──────────────────────────────────────────────────
export type FestivalCategoryKey = 'full' | 'camping' | 'daytripper' | 'committee'

export interface FestivalCategory {
  key: FestivalCategoryKey
  label: string
  hint: string
  adultKey: keyof FestivalFees
  kidKey: keyof FestivalFees
  /** Whether kids are free in this category (so the form can say so). */
  kidsFree?: boolean
}

export const FESTIVAL_CATEGORIES: FestivalCategory[] = [
  { key: 'full',       label: 'Full Weekend',             hint: 'All nights · the full festival',  adultKey: 'full_adult',      kidKey: 'full_kid' },
  { key: 'camping',    label: '1 Night Camping',          hint: 'A single night on site',          adultKey: 'camp_adult',      kidKey: 'camp_kid' },
  { key: 'daytripper', label: 'Day Tripper — No Camping', hint: 'Daytime only, no overnight stay', adultKey: 'day_adult',       kidKey: 'day_kid' },
  { key: 'committee',  label: 'Committee Member',         hint: 'Committee only · kids go free',   adultKey: 'committee_adult', kidKey: 'committee_kid', kidsFree: true },
]

export type FestivalTickets = Record<FestivalCategoryKey, { adults: number; kids: number }>

export const EMPTY_TICKETS: FestivalTickets = {
  full:       { adults: 0, kids: 0 },
  camping:    { adults: 0, kids: 0 },
  daytripper: { adults: 0, kids: 0 },
  committee:  { adults: 0, kids: 0 },
}

// ── Membership tier helpers ─────────────────────────────────────────────────────
/** Map a paid membership plan id to its monthly price (pence), or null. */
export function membershipPrice(prices: MembershipPrices, plan: MemberPlan): number | null {
  if (plan === 'playing' || plan === 'social_family' || plan === 'social_single') {
    return prices[plan]
  }
  return null
}

// ── Pure helpers (used on both client and server) ────────────────────────────────

const clampQty = (v: unknown): number => {
  const n = Math.floor(Number(v))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(50, n)
}

/** Coerce arbitrary input into a well-formed tickets object. */
export function normaliseTickets(raw: unknown): FestivalTickets {
  const out: FestivalTickets = {
    full:       { adults: 0, kids: 0 },
    camping:    { adults: 0, kids: 0 },
    daytripper: { adults: 0, kids: 0 },
    committee:  { adults: 0, kids: 0 },
  }
  if (raw && typeof raw === 'object') {
    for (const cat of FESTIVAL_CATEGORIES) {
      const r = (raw as Record<string, unknown>)[cat.key]
      if (r && typeof r === 'object') {
        out[cat.key] = {
          adults: clampQty((r as Record<string, unknown>).adults),
          kids: clampQty((r as Record<string, unknown>).kids),
        }
      }
    }
  }
  return out
}

/** Total people across all categories. */
export function totalAttendees(tickets: FestivalTickets): { adults: number; kids: number } {
  return FESTIVAL_CATEGORIES.reduce(
    (acc, c) => ({ adults: acc.adults + tickets[c.key].adults, kids: acc.kids + tickets[c.key].kids }),
    { adults: 0, kids: 0 }
  )
}

/** Subtotal (pence) for a single category. */
export function categorySubtotal(cat: FestivalCategory, tickets: FestivalTickets, fees: FestivalFees): number {
  const t = tickets[cat.key]
  return t.adults * fees[cat.adultKey] + t.kids * fees[cat.kidKey]
}

/** Grand total (pence) for a booking, computed from the editable fees. */
export function festivalTotal(tickets: FestivalTickets, fees: FestivalFees): number {
  return FESTIVAL_CATEGORIES.reduce((sum, c) => sum + categorySubtotal(c, tickets, fees), 0)
}

/** Merge a stored/raw value over the defaults so missing keys never break. */
export function mergePricing(raw: unknown): SitePricing {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<SitePricing>
  const num = (v: unknown, fallback: number): number => {
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback
  }
  const membership: MembershipPrices = {
    playing:       num(r.membership?.playing,       DEFAULT_PRICING.membership.playing),
    social_family: num(r.membership?.social_family, DEFAULT_PRICING.membership.social_family),
    social_single: num(r.membership?.social_single, DEFAULT_PRICING.membership.social_single),
  }
  const f = r.festival ?? {}
  const festival = {} as FestivalFees
  for (const key of Object.keys(DEFAULT_PRICING.festival) as (keyof FestivalFees)[]) {
    festival[key] = num((f as FestivalFees)[key], DEFAULT_PRICING.festival[key])
  }
  const foodOptions = Array.isArray(r.foodOptions)
    ? r.foodOptions.map(o => String(o).trim()).filter(Boolean).slice(0, 12)
    : DEFAULT_PRICING.foodOptions
  return {
    membership,
    festival,
    foodOptions: foodOptions.length ? foodOptions : DEFAULT_PRICING.foodOptions,
  }
}
