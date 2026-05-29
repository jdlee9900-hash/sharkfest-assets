'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminMemberPosts() {
  const router = useRouter()
  const [kind, setKind] = useState<'news' | 'event'>('news')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [cover, setCover] = useState('')
  const [eventAt, setEventAt] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError('')
    setMsg('')
    try {
      const res = await fetch('/api/admin/member-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          title,
          body,
          cover_public_id: cover || undefined,
          event_at: kind === 'event' && eventAt ? eventAt : undefined,
          location: kind === 'event' ? location : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not save post')
      setMsg('Post published.')
      setTitle(''); setBody(''); setCover(''); setEventAt(''); setLocation('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="mb-card" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <h2 className="mb-card-title">New members post</h2>

      <div className="join-toggle" role="tablist" aria-label="Post type" style={{ alignSelf: 'flex-start' }}>
        <button type="button" role="tab" aria-selected={kind === 'news'} className={`join-toggle-btn ${kind === 'news' ? 'is-active' : ''}`} onClick={() => setKind('news')}>News</button>
        <button type="button" role="tab" aria-selected={kind === 'event'} className={`join-toggle-btn ${kind === 'event' ? 'is-active' : ''}`} onClick={() => setKind('event')}>Event</button>
      </div>

      <div>
        <label htmlFor="mp-title" className="cu-label">Title</label>
        <input id="mp-title" className="cu-input" value={title} onChange={e => setTitle(e.target.value)} required maxLength={200} />
      </div>

      <div>
        <label htmlFor="mp-body" className="cu-label">Body</label>
        <textarea id="mp-body" className="cu-input" rows={4} value={body} onChange={e => setBody(e.target.value)} maxLength={10000} />
      </div>

      <div>
        <label htmlFor="mp-cover" className="cu-label">Cover image — Cloudinary public ID (optional)</label>
        <input id="mp-cover" className="cu-input" value={cover} onChange={e => setCover(e.target.value)} placeholder="sharkfest/members/cover-1" />
      </div>

      {kind === 'event' && (
        <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label htmlFor="mp-date" className="cu-label">Event date &amp; time</label>
            <input id="mp-date" type="datetime-local" className="cu-input" value={eventAt} onChange={e => setEventAt(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label htmlFor="mp-loc" className="cu-label">Location</label>
            <input id="mp-loc" className="cu-input" value={location} onChange={e => setLocation(e.target.value)} maxLength={200} />
          </div>
        </div>
      )}

      {error && <div className="auth-error" role="alert">{error}</div>}
      {msg && <p style={{ color: '#16a34a', fontSize: '0.875rem', margin: 0 }}>{msg}</p>}

      <button type="submit" className="btn btn-accent" disabled={saving || !title.trim()} style={{ alignSelf: 'flex-start' }}>
        {saving ? 'Publishing…' : 'Publish post'}
      </button>
    </form>
  )
}
