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
  2028: {
    year: 2028,
    name: 'SharkFest 2028',
    dates: '22–25 May 2028',
    location: 'Torbay Sharks RFC · Devon Coast',
  },
}

// The event the rest of the site defaults to when no year is specified. Keeping
// this at 2028 means existing links (/register with no query) are unchanged.
export const DEFAULT_EVENT_YEAR = 2028

export function isValidEventYear(year: unknown): boolean {
  return Object.prototype.hasOwnProperty.call(EVENTS, Number(year))
}

/** Resolve a year (string or number, possibly missing) to a known event. */
export function getEvent(year: unknown): FestivalEvent {
  const y = Number(year)
  return isValidEventYear(y) ? EVENTS[y] : EVENTS[DEFAULT_EVENT_YEAR]
}

/**
 * Whether registration is open for a given event year. 2028 keeps the original
 * `REGISTRATION_OPEN` flag for backward compatibility; other years are gated by
 * `REGISTRATION_OPEN_<year>` (e.g. `REGISTRATION_OPEN_2027`) so each event can be
 * opened independently.
 */
export function isRegistrationOpen(year: number): boolean {
  if (year === DEFAULT_EVENT_YEAR) return process.env.REGISTRATION_OPEN === 'true'
  return process.env[`REGISTRATION_OPEN_${year}`] === 'true'
}
