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
}

export const EVENTS: Record<number, FestivalEvent> = {
  2027: {
    year: 2027,
    name: 'SharkFest 2027',
    dates: '28–31 May 2027',
    location: 'Torbay Sharks RFC · Devon Coast',
    tagline: '25th Anniversary',
    membersOnly: true,
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
 * Whether registration is open for a given event. Booking is open by default for
 * any confirmed event; set `REGISTRATION_OPEN_<year>=false` (e.g.
 * `REGISTRATION_OPEN_2027=false`) to pause it without a code change.
 */
export function isRegistrationOpen(year: number): boolean {
  if (!isValidEventYear(year)) return false
  return process.env[`REGISTRATION_OPEN_${year}`] !== 'false'
}
