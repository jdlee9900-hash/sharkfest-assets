import type { EventRsvp } from '@/lib/types'

interface Props {
  title: string
  rsvps: EventRsvp[]
}

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

/** Collapsible interest list for a single event, shown in the admin events table. */
export function AdminEventRsvps({ title, rsvps }: Props) {
  const going = rsvps.filter(r => r.response === 'going')
  const notGoing = rsvps.filter(r => r.response === 'not_going')
  const adults = going.reduce((s, r) => s + r.adults, 0)
  const kids = going.reduce((s, r) => s + r.kids, 0)
  const headcount = adults + kids

  return (
    <details className="rsvp-admin">
      <summary className="rsvp-admin-summary">
        <span className="rsvp-admin-event">{title}</span>
        <span className="rsvp-admin-counts">
          <span className="rsvp-pill rsvp-pill--going">{going.length} interested</span>
          {headcount > 0 && <span className="rsvp-pill">{adults} adult{adults !== 1 ? 's' : ''}{kids ? ` · ${kids} child${kids !== 1 ? 'ren' : ''}` : ''} · {headcount} total</span>}
          {notGoing.length > 0 && <span className="rsvp-pill rsvp-pill--no">{notGoing.length} can&apos;t make it</span>}
        </span>
      </summary>

      {rsvps.length === 0 ? (
        <p style={{ color: 'var(--grey-400)', fontSize: '0.9rem', margin: '0.75rem 0 0' }}>No responses yet.</p>
      ) : (
        <table className="mb-pay-table" style={{ marginTop: '0.75rem' }}>
          <thead><tr><th>Member</th><th>Email</th><th>Response</th><th>Adults</th><th>Children</th><th>Note</th><th>Updated</th></tr></thead>
          <tbody>
            {going.concat(notGoing).map(r => (
              <tr key={r.id}>
                <td>{r.name ?? '—'}</td>
                <td>{r.email}</td>
                <td>{r.response === 'going' ? 'Coming' : "Can't make it"}</td>
                <td>{r.response === 'going' ? r.adults : '—'}</td>
                <td>{r.response === 'going' ? r.kids : '—'}</td>
                <td>{r.note ?? '—'}</td>
                <td>{fmtWhen(r.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </details>
  )
}
