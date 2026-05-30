'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MemberPostKind } from '@/lib/types'

interface Props {
  /** Which kind of member content this form authors. */
  kind: MemberPostKind
}

/**
 * Authoring form for member-area content. Rendered once per kind so the admin gets
 * a distinct "Exclusive content" section and a "Member events" section.
 */
export function AdminMemberPosts({ kind }: Props) {
  const router = useRouter()
  const isEvent = kind === 'event'

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [cover, setCover] = useState('')
  const [eventAt, setEventAt] = useState('')
  const [eventEnd, setEventEnd] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const reset = () => {
    setTitle(''); setSummary(''); setBody(''); setCover('')
    setEventAt(''); setEventEnd(''); setLocation('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true); setError(''); setMsg('')
    try {
      const res = await fetch('/api/admin/member-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          title,
          summary: summary || undefined,
          body,
          cover_public_id: cover || undefined,
          event_at: isEvent && eventAt ? eventAt : undefined,
          event_end: isEvent && eventEnd ? eventEnd : undefined,
          location: isEvent ? location : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not save')
      setMsg(isEvent ? 'Event published.' : 'Content published.')
      reset()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="mb-card" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <h2 className="mb-card-title">{isEvent ? 'Add a member event' : 'Add exclusive content'}</h2>
      <p style={{ color: 'var(--grey-400)', fontSize: '0.875rem', margin: 0 }}>
        {isEvent
          ? 'Creates a full event page visible only to logged-in members.'
          : 'Posts an article to the members-only content feed.'}
      </p>

      <div>
        <label htmlFor={`${kind}-title`} className="cu-label">Title</label>
        <input id={`${kind}-title`} className="cu-input" value={title} onChange={e => setTitle(e.target.value)} required maxLength={200} />
      </div>

      <div>
        <label htmlFor={`${kind}-summary`} className="cu-label">
          {isEvent ? 'Short summary — shown on the events list' : 'Short summary — shown on the feed (optional)'}
        </label>
        <input id={`${kind}-summary`} className="cu-input" value={summary} onChange={e => setSummary(e.target.value)} maxLength={500} placeholder="One line teaser" />
      </div>

      {isEvent && (
        <>
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label htmlFor="event-start" className="cu-label">Starts</label>
              <input id="event-start" type="datetime-local" className="cu-input" value={eventAt} onChange={e => setEventAt(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label htmlFor="event-end" className="cu-label">Ends (optional)</label>
              <input id="event-end" type="datetime-local" className="cu-input" value={eventEnd} onChange={e => setEventEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <label htmlFor="event-loc" className="cu-label">Location</label>
            <input id="event-loc" className="cu-input" value={location} onChange={e => setLocation(e.target.value)} maxLength={200} />
          </div>
        </>
      )}

      <div>
        <label htmlFor={`${kind}-body`} className="cu-label">
          {isEvent ? 'Full details — agenda, what to bring, how to RSVP…' : 'Body'}
        </label>
        <textarea id={`${kind}-body`} className="cu-input" rows={isEvent ? 6 : 4} value={body} onChange={e => setBody(e.target.value)} maxLength={10000} />
      </div>

      <div>
        <label htmlFor={`${kind}-cover`} className="cu-label">Cover image — Cloudinary public ID (optional)</label>
        <input id={`${kind}-cover`} className="cu-input" value={cover} onChange={e => setCover(e.target.value)} placeholder="sharkfest/members/cover-1" />
      </div>

      {error && <div className="auth-error" role="alert">{error}</div>}
      {msg && <p style={{ color: '#16a34a', fontSize: '0.875rem', margin: 0 }}>{msg}</p>}

      <button type="submit" className="btn btn-accent" disabled={saving || !title.trim()} style={{ alignSelf: 'flex-start' }}>
        {saving ? 'Publishing…' : isEvent ? 'Publish event' : 'Publish content'}
      </button>
    </form>
  )
}
