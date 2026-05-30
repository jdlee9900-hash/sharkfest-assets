'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RsvpResponse } from '@/lib/types'

interface Props {
  eventId: string
  initial: {
    response: RsvpResponse | null
    adults: number
    kids: number
    note: string
  }
}

function Stepper({ label, value, onChange, min }: { label: string; value: number; onChange: (n: number) => void; min: number }) {
  return (
    <div className="rsvp-stepper">
      <span className="rsvp-stepper-label">{label}</span>
      <div className="rsvp-stepper-ctrl">
        <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
        <span aria-live="polite">{value}</span>
        <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(Math.min(50, value + 1))} disabled={value >= 50}>+</button>
      </div>
    </div>
  )
}

export function EventRsvp({ eventId, initial }: Props) {
  const router = useRouter()
  const [response, setResponse] = useState<RsvpResponse | null>(initial.response)
  const [adults, setAdults] = useState(initial.adults || 1)
  const [kids, setKids] = useState(initial.kids || 0)
  const [note, setNote] = useState(initial.note)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const submit = async (resp: RsvpResponse) => {
    setResponse(resp)
    setBusy(true); setError(''); setSaved(false)
    try {
      const res = await fetch('/api/members/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          response: resp,
          adults: resp === 'going' ? adults : 0,
          kids: resp === 'going' ? kids : 0,
          note: note || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not save your response')
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rsvp-card">
      <h2 className="rsvp-title">Will you be there?</h2>
      <p className="rsvp-sub">Let us know so we can plan numbers. You can change your response any time.</p>

      <div className="rsvp-choice" role="group" aria-label="Your response">
        <button
          type="button"
          className={`rsvp-btn rsvp-btn--going ${response === 'going' ? 'is-active' : ''}`}
          aria-pressed={response === 'going'}
          onClick={() => setResponse('going')}
          disabled={busy}
        >
          ✓ I&apos;m coming
        </button>
        <button
          type="button"
          className={`rsvp-btn rsvp-btn--no ${response === 'not_going' ? 'is-active' : ''}`}
          aria-pressed={response === 'not_going'}
          onClick={() => submit('not_going')}
          disabled={busy}
        >
          Can&apos;t make it
        </button>
      </div>

      {response === 'going' && (
        <div className="rsvp-party">
          <Stepper label="Adults" value={adults} onChange={setAdults} min={1} />
          <Stepper label="Children" value={kids} onChange={setKids} min={0} />
          <div className="rsvp-note">
            <label htmlFor="rsvp-note" className="cu-label">Anything we should know? (optional)</label>
            <input id="rsvp-note" className="cu-input" value={note} onChange={e => setNote(e.target.value)} maxLength={500} placeholder="Dietary needs, arrival time…" />
          </div>
          <button type="button" className="btn btn-accent" onClick={() => submit('going')} disabled={busy} style={{ alignSelf: 'flex-start' }}>
            {busy ? 'Saving…' : initial.response ? 'Update my RSVP' : 'Confirm my RSVP'}
          </button>
        </div>
      )}

      {error && <div className="auth-error" role="alert" style={{ marginTop: '0.75rem' }}>{error}</div>}
      {saved && !error && (
        <p className="rsvp-saved" role="status">
          {response === 'going'
            ? `You're down for ${adults} adult${adults !== 1 ? 's' : ''}${kids ? ` and ${kids} child${kids !== 1 ? 'ren' : ''}` : ''} — see you there!`
            : 'Thanks for letting us know.'}
        </p>
      )}
    </div>
  )
}
