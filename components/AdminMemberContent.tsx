'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { MemberPost, MemberPostKind } from '@/lib/types'
import { thumbUrl } from '@/lib/cloudinary'

interface Props {
  kind: MemberPostKind
  posts: MemberPost[]
}

// XHR upload (reliable on mobile) directly to Cloudinary using an admin-signed token.
function xhrUpload(url: string, fd: FormData, onProgress: (pct: number) => void): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.timeout = 120_000
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)) } catch { reject(new Error('Bad upload response')) }
      } else {
        let msg = 'Upload failed'
        try { msg = JSON.parse(xhr.responseText)?.error?.message ?? msg } catch { /* noop */ }
        reject(new Error(msg))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.ontimeout = () => reject(new Error('Upload timed out — try a smaller image'))
    xhr.send(fd)
  })
}

// Format an ISO timestamp for a datetime-local input (local time, no seconds).
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface FormState {
  id: string | null
  title: string
  summary: string
  body: string
  cover: string
  eventAt: string
  eventEnd: string
  location: string
  published: boolean
}

const emptyForm: FormState = {
  id: null, title: '', summary: '', body: '', cover: '',
  eventAt: '', eventEnd: '', location: '', published: true,
}

export function AdminMemberContent({ kind, posts }: Props) {
  const router = useRouter()
  const isEvent = kind === 'event'
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const editing = form.id !== null
  const set = (patch: Partial<FormState>) => setForm(prev => ({ ...prev, ...patch }))

  const startEdit = (p: MemberPost) => {
    setMsg(''); setError('')
    setForm({
      id: p.id,
      title: p.title,
      summary: p.summary ?? '',
      body: p.body ?? '',
      cover: p.cover_public_id ?? '',
      eventAt: toLocalInput(p.event_at),
      eventEnd: toLocalInput(p.event_end),
      location: p.location ?? '',
      published: p.published,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => { setForm(emptyForm); setMsg(''); setError('') }

  const handleFile = async (file: File) => {
    setError(''); setMsg(''); setUploadPct(0)
    try {
      const sigRes = await fetch('/api/admin/member-image', { method: 'POST' })
      if (!sigRes.ok) throw new Error((await sigRes.json().catch(() => ({})))?.error ?? 'Could not prepare upload')
      const sig = await sigRes.json()

      const fd = new FormData()
      fd.append('file', file)
      fd.append('api_key', sig.apiKey)
      fd.append('timestamp', String(sig.timestamp))
      fd.append('signature', sig.signature)
      fd.append('folder', sig.folder)
      fd.append('allowed_formats', sig.allowedFormats)

      const result = await xhrUpload(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, fd, setUploadPct)
      const publicId = result.public_id as string
      if (!publicId) throw new Error('Upload returned no image id')
      set({ cover: publicId })
      setMsg('Image uploaded.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadPct(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true); setError(''); setMsg('')
    try {
      const payload = {
        id: form.id ?? undefined,
        kind,
        title: form.title,
        summary: form.summary || undefined,
        body: form.body,
        cover_public_id: form.cover || undefined,
        event_at: isEvent && form.eventAt ? form.eventAt : undefined,
        event_end: isEvent && form.eventEnd ? form.eventEnd : undefined,
        location: isEvent ? form.location : undefined,
        published: form.published,
      }
      const res = await fetch('/api/admin/member-post', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not save')
      setMsg(editing ? 'Saved.' : isEvent ? 'Event published.' : 'Content published.')
      setForm(emptyForm)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this permanently? This cannot be undone.')) return
    setDeletingId(id); setError(''); setMsg('')
    try {
      const res = await fetch(`/api/admin/member-post?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not delete')
      if (form.id === id) setForm(emptyForm)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete')
    } finally {
      setDeletingId(null)
    }
  }

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* ── Create / edit form ─────────────────────────────────────────── */}
      <form className="mb-card" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <h3 className="mb-card-title">
          {editing
            ? (isEvent ? 'Edit event' : 'Edit content')
            : (isEvent ? 'Add a member event' : 'Add exclusive content')}
        </h3>
        <p style={{ color: 'var(--grey-400)', fontSize: '0.875rem', margin: 0 }}>
          {isEvent
            ? 'Creates a full event page visible only to logged-in members.'
            : 'Posts an article to the members-only content feed.'}
        </p>

        <div>
          <label htmlFor={`${kind}-title`} className="cu-label">Title</label>
          <input id={`${kind}-title`} className="cu-input" value={form.title} onChange={e => set({ title: e.target.value })} required maxLength={200} />
        </div>

        <div>
          <label htmlFor={`${kind}-summary`} className="cu-label">
            {isEvent ? 'Short summary — shown on the events list' : 'Short summary — shown on the feed (optional)'}
          </label>
          <input id={`${kind}-summary`} className="cu-input" value={form.summary} onChange={e => set({ summary: e.target.value })} maxLength={500} placeholder="One line teaser" />
        </div>

        {isEvent && (
          <>
            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label htmlFor="event-start" className="cu-label">Starts</label>
                <input id="event-start" type="datetime-local" className="cu-input" value={form.eventAt} onChange={e => set({ eventAt: e.target.value })} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label htmlFor="event-end" className="cu-label">Ends (optional)</label>
                <input id="event-end" type="datetime-local" className="cu-input" value={form.eventEnd} onChange={e => set({ eventEnd: e.target.value })} />
              </div>
            </div>
            <div>
              <label htmlFor="event-loc" className="cu-label">Location</label>
              <input id="event-loc" className="cu-input" value={form.location} onChange={e => set({ location: e.target.value })} maxLength={200} />
            </div>
          </>
        )}

        <div>
          <label htmlFor={`${kind}-body`} className="cu-label">
            {isEvent ? 'Full details — agenda, what to bring, how to RSVP…' : 'Body'}
          </label>
          <textarea id={`${kind}-body`} className="cu-input" rows={isEvent ? 6 : 4} value={form.body} onChange={e => set({ body: e.target.value })} maxLength={10000} />
        </div>

        {/* Image upload */}
        <div>
          <label className="cu-label">Cover image</label>
          <div className="mc-image">
            {form.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="mc-image-preview" src={thumbUrl(form.cover, 320)} alt="Cover preview" />
            ) : (
              <div className="mc-image-empty" aria-hidden="true">No image</div>
            )}
            <div className="mc-image-actions">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
              />
              <button type="button" className="btn" style={{ border: '1px solid var(--grey-300,#cbd5e1)', background: 'transparent', color: 'var(--navy-800)' }} onClick={() => fileRef.current?.click()} disabled={uploadPct !== null}>
                {uploadPct !== null ? `Uploading… ${uploadPct}%` : form.cover ? 'Replace image' : 'Upload image'}
              </button>
              {form.cover && uploadPct === null && (
                <button type="button" className="mc-link-danger" onClick={() => set({ cover: '' })}>Remove</button>
              )}
            </div>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--navy-800)' }}>
          <input type="checkbox" checked={form.published} onChange={e => set({ published: e.target.checked })} />
          Published (visible to members)
        </label>

        {error && <div className="auth-error" role="alert">{error}</div>}
        {msg && <p style={{ color: '#16a34a', fontSize: '0.875rem', margin: 0 }}>{msg}</p>}

        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button type="submit" className="btn btn-accent" disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : editing ? 'Save changes' : isEvent ? 'Publish event' : 'Publish content'}
          </button>
          {editing && (
            <button type="button" className="btn" style={{ border: '1px solid var(--grey-300,#cbd5e1)', background: 'transparent', color: 'var(--grey-500)' }} onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* ── Existing items ─────────────────────────────────────────────── */}
      <div className="mb-card">
        <h3 className="mb-card-title" style={{ marginBottom: '1rem' }}>{isEvent ? 'Events' : 'Published content'}</h3>
        {posts.length === 0 ? (
          <p style={{ color: 'var(--grey-400)', fontSize: '0.9375rem' }}>{isEvent ? 'No events yet.' : 'No content yet.'}</p>
        ) : (
          <div className="mb-table-scroll">
            <table className="mb-pay-table">
              <thead>
                <tr>
                  <th>Title</th>
                  {isEvent && <th>When</th>}
                  {isEvent && <th>Location</th>}
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {posts.map(p => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    {isEvent && <td>{fmtDate(p.event_at)}</td>}
                    {isEvent && <td>{p.location ?? '—'}</td>}
                    <td>{p.published ? 'Published' : 'Draft'}</td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button type="button" className="mc-link" onClick={() => startEdit(p)}>Edit</button>
                      <button type="button" className="mc-link-danger" onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}>
                        {deletingId === p.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
