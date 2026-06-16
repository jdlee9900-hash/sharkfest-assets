'use client'

import { useState, useEffect, useRef } from 'react'

export interface Picked { id: string; name: string }

export const MAX_CAMP_NEAR = 1

/**
 * Typeahead picker for "camp near" — searches people already registered for a
 * given event and lets someone nominate one (or more) of them. Selections are
 * stored as their registration id, so it stays properly linked in the database.
 *
 * Used on the registration form and on the My Booking page.
 */
export function CampNearPicker({
  year, eventName, picked, onChange, excludeId, max = MAX_CAMP_NEAR,
}: {
  year: number
  eventName: string
  picked: Picked[]
  onChange: (next: Picked[]) => void
  /** A registration id to hide from results (e.g. the viewer's own booking). */
  excludeId?: string
  /** How many people/families may be picked. Defaults to one. */
  max?: number
}) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<Picked[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const full = picked.length >= max

  // Debounced search; skips ids already chosen / the viewer, and anything under 2 chars.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2 || full) { setResults([]); setLoading(false); return }
    setLoading(true)
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/registrations/search?q=${encodeURIComponent(q)}&year=${year}`, { signal: ctrl.signal })
        const body = await res.json()
        const items: Picked[] = Array.isArray(body.results) ? body.results : []
        setResults(items.filter(i => i.id !== excludeId && !picked.some(p => p.id === i.id)))
        setOpen(true)
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [query, year, picked, full, excludeId])

  // Close the dropdown when clicking away.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const add = (item: Picked) => {
    if (picked.length >= max) return
    onChange([...picked, item])
    setQuery(''); setResults([]); setOpen(false)
  }
  const remove = (id: string) => onChange(picked.filter(p => p.id !== id))

  return (
    <div className="cn-picker" ref={boxRef}>
      {picked.length > 0 && (
        <ul className="cn-chips">
          {picked.map(p => (
            <li key={p.id} className="cn-chip">
              <span className="cn-chip-mark" aria-hidden="true">⛺</span>
              {p.name}
              <button type="button" className="cn-chip-remove" onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <div className="cn-input-wrap">
          <input
            type="text"
            className="cu-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => { if (results.length) setOpen(true) }}
            placeholder="Start typing a name…"
            autoComplete="off"
            aria-label="Search people who have already registered"
          />
          {open && query.trim().length >= 2 && (
            <ul className="cn-results">
              {loading && <li className="cn-result cn-result--note">Searching…</li>}
              {!loading && results.length === 0 && (
                <li className="cn-result cn-result--note">No one by that name has registered for {eventName} yet.</li>
              )}
              {results.map(r => (
                <li key={r.id}>
                  <button type="button" className="cn-result" onClick={() => add(r)}>
                    <span className="cn-result-mark" aria-hidden="true">⛺</span>
                    {r.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="cn-hint">
        {full
          ? `You've made your choice. Remove it to pick someone else.`
          : `Optional — pick ${max === 1 ? 'one family' : `up to ${max} families`} you’d like to be pitched near. You can only choose people who’ve already registered for ${eventName}, so if you’re one of the first there may be no one to pick yet. Feel free to leave this blank.`}
      </p>
    </div>
  )
}
