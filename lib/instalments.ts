// Instalment payment calculation for SharkFest 2027 festival bookings.
// Three equal instalments are spaced to the nearest start of month across the
// period from booking date to event date.
// Instalments are only offered when booking at least 4 months before the event
// (i.e. before 1 February 2027). After that cut-off, full payment is required.

// SharkFest 2027 event date (UTC midnight)
const EVENT_DATE = new Date('2027-05-28T00:00:00Z')

// 4 months before May 28 → 1 February 2027
export const INSTALMENT_CUTOFF = new Date('2027-02-01T00:00:00Z')

export interface InstalmentScheduleItem {
  label: string
  amount: number    // pence
  dueDate: Date
  dueDateIso: string  // YYYY-MM-DD
}

/** Whether the instalment option is still available at the given booking date. */
export function isInstalmentAvailable(bookingDate: Date): boolean {
  return bookingDate < INSTALMENT_CUTOFF
}

/**
 * Calculate 3 instalment due dates and amounts.
 * Due dates are snapped to the nearest start of month (day ≤ 15 → same month,
 * day > 15 → next month), then capped at 1 May so none fall after the event.
 * The third instalment absorbs any rounding remainder.
 */
export function calculateInstalmentSchedule(
  bookingDate: Date,
  totalPence: number,
): InstalmentScheduleItem[] {
  const totalMs = EVENT_DATE.getTime() - bookingDate.getTime()
  const spacingMs = totalMs / 3

  const dueDates = [1, 2, 3].map(n => {
    const raw = new Date(bookingDate.getTime() + n * spacingMs)
    return snapToStartOfMonth(raw)
  })

  // Deduplicate: if adjacent entries land in the same month, push later ones forward.
  for (let i = 1; i < dueDates.length; i++) {
    if (isSameYearMonth(dueDates[i], dueDates[i - 1])) {
      dueDates[i] = addMonths(dueDates[i - 1], 1)
    }
  }

  // Cap the final instalment at 1 May (the event month).
  const maxDue = new Date('2027-05-01T00:00:00Z')
  if (dueDates[dueDates.length - 1] > maxDue) {
    dueDates[dueDates.length - 1] = maxDue
  }

  // Equal split; third instalment captures the rounding remainder.
  const base = Math.floor(totalPence / 3)
  const last = totalPence - base * 2

  return dueDates.map((dueDate, i) => ({
    label: `Instalment ${i + 1} of 3`,
    amount: i === 2 ? last : base,
    dueDate,
    dueDateIso: dueDate.toISOString().slice(0, 10),
  }))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function snapToStartOfMonth(date: Date): Date {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  const d = date.getUTCDate()
  // Nearest start of month: day ≤ 15 → 1st of same month, else 1st of next.
  return d <= 15
    ? new Date(Date.UTC(y, m, 1))
    : new Date(Date.UTC(y, m + 1, 1))
}

function isSameYearMonth(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth()
}

function addMonths(date: Date, n: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1))
}
