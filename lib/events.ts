// Central festival/event config. Registrations are tagged with a `year`, and a
// few user-facing strings (dates, names) differ per event — keep them here so
// the registration flow, emails and event pages all stay in sync.

export interface FestivalEvent {
  year: number
  /** Full display name, e.g. "SharkFest 2027" */
  name: string
  /** Human date range, e.g. "28–31 May 2027" */
  dates: string
  /** Where it happens */
  location: string
  /** Optional flourish shown alongside the name, e.g. "25th Anniversary" */
  tagline?: string
  /** When true, only logged-in active members can view/register for this event. */
  membersOnly?: boolean
  /**
   * Default registration state when no `REGISTRATION_OPEN_<year>` env override is
   * set. Defaults to closed ("coming soon") so a missing env var never silently
   * opens booking before you're ready.
   */
  registrationOpen?: boolean
}

export const EVENTS: Record<number, FestivalEvent> = {
  2027: {
    year: 2027,
    name: 'SharkFest 2027',
    dates: '28–31 May 2027',
    location: 'Torbay Sharks RFC · Devon Coast',
    tagline: '25th Anniversary',
    membersOnly: true,
    // "Signups coming soon" — flip to true (or set REGISTRATION_OPEN_2027=true)
    // when you're ready to take festival bookings.
    registrationOpen: false,
  },
}

// The confirmed festival — what the site defaults to when no year is specified.
export const DEFAULT_EVENT_YEAR = 2027

export function isValidEventYear(year: unknown): boolean {
  return Object.prototype.hasOwnProperty.call(EVENTS, Number(year))
}

/** Resolve a year (string or number, possibly missing) to a known event. */
export function getEvent(year: unknown): FestivalEvent {
  const y = Number(year)
  return isValidEventYear(y) ? EVENTS[y] : EVENTS[DEFAULT_EVENT_YEAR]
}

/**
 * Whether registration is open for a given event. The env var
 * `REGISTRATION_OPEN_<year>` overrides either way (`=true` opens, `=false` closes);
 * with no override it falls back to the event's `registrationOpen` default
 * (closed unless explicitly set), so a forgotten env var can't open booking early.
 */
export function isRegistrationOpen(year: number): boolean {
  if (!isValidEventYear(year)) return false
  const override = process.env[`REGISTRATION_OPEN_${year}`]
  if (override === 'true') return true
  if (override === 'false') return false
  return EVENTS[year].registrationOpen ?? false
}
