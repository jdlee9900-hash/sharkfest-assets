'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'contacts' | 'campaigns'

interface Contact {
  id: string
  email: string
  first_name: string
  last_name: string
  source: 'manual' | 'registration' | 'membership'
  unsubscribed: boolean
  created_at: string
}

interface Campaign {
  id: string
  subject: string
  body: string
  status: 'draft' | 'sending' | 'sent' | 'partial'
  total_count: number
  sent_count: number
  failed_count: number
  created_at: string
  sent_at: string | null
}

interface SendProgress {
  sent: number
  failed: number
  remaining: number
}

interface ContactsStats {
  total: number
  active: number
  unsubscribed: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Campaign['status'] }) {
  const map: Record<Campaign['status'], { label: string; bg: string; color: string }> = {
    draft:   { label: 'Draft',   bg: '#f1f5f9', color: '#475569' },
    sending: { label: 'Sending', bg: '#dbeafe', color: '#1d4ed8' },
    sent:    { label: 'Sent',    bg: '#dcfce7', color: '#15803d' },
    partial: { label: 'Partial', bg: '#fef3c7', color: '#92400e' },
  }
  const { label, bg, color } = map[status]
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: '0.75rem',
      fontWeight: 600,
      background: bg,
      color,
      letterSpacing: '0.02em',
    }}>
      {label}
    </span>
  )
}

function SourceBadge({ source }: { source: Contact['source'] }) {
  const map: Record<Contact['source'], { label: string; bg: string; color: string }> = {
    manual:       { label: 'Manual',       bg: '#f1f5f9', color: '#475569' },
    registration: { label: 'Registration', bg: '#dbeafe', color: '#1d4ed8' },
    membership:   { label: 'Membership',   bg: '#fef3c7', color: '#92400e' },
  }
  const { label, bg, color } = map[source]
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: '0.75rem',
      fontWeight: 600,
      background: bg,
      color,
    }}>
      {label}
    </span>
  )
}

// ─── Contacts Tab ─────────────────────────────────────────────────────────────

function ContactsTab() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<ContactsStats>({ total: 0, active: 0, unsubscribed: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [syncError, setSyncError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/mailing-list/contacts')
      if (!res.ok) throw new Error(`Failed to load contacts (${res.status})`)
      const data = await res.json()
      setContacts(data.contacts ?? [])
      setStats(data.stats ?? { total: 0, active: 0, unsubscribed: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg('')
    setSyncError('')
    try {
      const res = await fetch('/api/admin/mailing-list/sync', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Sync failed (${res.status})`)
      }
      const data = await res.json()
      setSyncMsg(
        data.message ??
        `Sync complete: ${data.added ?? 0} added, ${data.updated ?? 0} updated`
      )
      await load()
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? contacts.filter(c =>
        c.email.toLowerCase().includes(q) ||
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
      )
    : contacts

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: stats.total, color: '#0f172a' },
          { label: 'Active', value: stats.active, color: '#15803d' },
          { label: 'Unsubscribed', value: stats.unsubscribed, color: '#b91c1c' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '12px 20px',
            minWidth: 110,
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{loading ? '—' : value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Search by email or name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            height: 36,
            padding: '0 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: '0.875rem',
            outline: 'none',
            background: '#ffffff',
          }}
        />
        <button
          onClick={handleSync}
          disabled={syncing || loading}
          style={{
            height: 36,
            padding: '0 16px',
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            background: '#f1f5f9',
            color: '#0f172a',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: syncing ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {syncing ? 'Syncing…' : 'Sync from registrations & members'}
        </button>
      </div>

      {syncMsg && (
        <div style={{ padding: '10px 14px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: '0.875rem', color: '#15803d' }}>
          {syncMsg}
        </div>
      )}
      {syncError && (
        <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, fontSize: '0.875rem', color: '#b91c1c' }}>
          {syncError}
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, fontSize: '0.875rem', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
            Loading contacts…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
            {contacts.length === 0 ? 'No contacts yet. Try syncing from registrations & members.' : 'No contacts match your search.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Email', 'Name', 'Source', 'Status', 'Added'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left',
                      padding: '10px 16px',
                      fontWeight: 600,
                      color: '#64748b',
                      fontSize: '0.75rem',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid #e2e8f0',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #e2e8f0' : undefined }}>
                    <td style={{ padding: '10px 16px', color: '#0f172a' }}>{c.email}</td>
                    <td style={{ padding: '10px 16px', color: '#0f172a' }}>
                      {[c.first_name, c.last_name].filter(Boolean).join(' ') || <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 16px' }}><SourceBadge source={c.source} /></td>
                    <td style={{ padding: '10px 16px' }}>
                      {c.unsubscribed
                        ? <span style={{ color: '#ef4444', fontWeight: 500 }}>Unsubscribed</span>
                        : <span style={{ color: '#22c55e', fontWeight: 500 }}>Active</span>
                      }
                    </td>
                    <td style={{ padding: '10px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(c.created_at)}</td>
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

// ─── New Campaign Form ────────────────────────────────────────────────────────

interface NewCampaignFormProps {
  onCreated: (campaign: Campaign) => void
  onCancel: () => void
}

function NewCampaignForm({ onCreated, onCancel }: NewCampaignFormProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!subject.trim() || !body.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Failed to create campaign (${res.status})`)
      }
      const data = await res.json()
      onCreated(data.campaign ?? data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>New Campaign</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Subject</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Enter email subject…"
          style={{
            height: 36,
            padding: '0 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: '0.875rem',
            outline: 'none',
            background: '#ffffff',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Body</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your email body here…"
          rows={10}
          style={{
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: '0.875rem',
            outline: 'none',
            background: '#ffffff',
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: 1.6,
          }}
        />
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
          Write plain text. Separate paragraphs with a blank line. Use {'{{first_name}}'} to personalise.
        </p>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, fontSize: '0.875rem', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleCreate}
          disabled={saving || !subject.trim() || !body.trim()}
          style={{
            height: 36,
            padding: '0 16px',
            borderRadius: 6,
            border: 'none',
            background: saving || !subject.trim() || !body.trim() ? '#94a3b8' : '#0f172a',
            color: '#ffffff',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? 'Creating…' : 'Create Draft'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            height: 36,
            padding: '0 16px',
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            background: '#f1f5f9',
            color: '#0f172a',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{ background: '#e2e8f0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: '#22c55e',
          borderRadius: 4,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}

// ─── Campaign Detail View ─────────────────────────────────────────────────────

interface CampaignDetailProps {
  campaign: Campaign
  activeContacts: number
  onBack: () => void
  onUpdated: (campaign: Campaign) => void
}

function CampaignDetail({ campaign: initial, activeContacts, onBack, onUpdated }: CampaignDetailProps) {
  const [campaign, setCampaign] = useState<Campaign>(initial)
  const [editSubject, setEditSubject] = useState(initial.subject)
  const [editBody, setEditBody] = useState(initial.body)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  const [progress, setProgress] = useState<SendProgress | null>(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const isDraft = campaign.status === 'draft'
  const isSending = campaign.status === 'sending'
  const isPartial = campaign.status === 'partial'
  const isSent = campaign.status === 'sent'
  const isEditable = isDraft

  const dirty = editSubject !== campaign.subject || editBody !== campaign.body

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    setSaveMsg('')
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: editSubject.trim(), body: editBody.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Failed to save (${res.status})`)
      }
      const data = await res.json()
      const updated: Campaign = data.campaign ?? { ...campaign, subject: editSubject.trim(), body: editBody.trim() }
      setCampaign(updated)
      onUpdated(updated)
      setSaveMsg('Saved.')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const runSendLoop = useCallback(async (campaignId: string) => {
    setSending(true)
    setSendError('')
    let remaining = 1
    while (remaining > 0) {
      try {
        const res = await fetch(`/api/admin/campaigns/${campaignId}/send-batch`, { method: 'POST' })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? `Send batch failed (${res.status})`)
        }
        const data: SendProgress = await res.json()
        remaining = data.remaining
        setProgress(data)
        setCampaign(prev => ({
          ...prev,
          sent_count: data.sent,
          failed_count: data.failed,
          status: remaining === 0 ? (data.failed > 0 ? 'partial' : 'sent') : 'sending',
        }))
      } catch (err) {
        setSendError(err instanceof Error ? err.message : 'Send failed')
        break
      }
    }
    setSending(false)
  }, [])

  const handlePrepareAndSend = async () => {
    setSendError('')
    setSending(true)
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}/prepare`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Prepare failed (${res.status})`)
      }
      const data = await res.json()
      const prepared: Campaign = data.campaign ?? { ...campaign, status: 'sending' }
      setCampaign(prepared)
      onUpdated(prepared)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Prepare failed')
      setSending(false)
      return
    }
    setSending(false)
    await runSendLoop(campaign.id)
  }

  const handleContinueSending = async () => {
    await runSendLoop(campaign.id)
  }

  const handleRetryFailed = async () => {
    setSendError('')
    setSending(true)
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}/retry-failed`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Retry failed (${res.status})`)
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Retry failed')
      setSending(false)
      return
    }
    setSending(false)
    await runSendLoop(campaign.id)
  }

  const total = campaign.total_count || activeContacts
  const sent = progress?.sent ?? campaign.sent_count
  const failed = progress?.failed ?? campaign.failed_count

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            height: 36,
            width: 36,
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            background: '#f1f5f9',
            color: '#0f172a',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-label="Back to campaigns"
        >
          ←
        </button>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', flex: 1 }}>
          {campaign.subject}
        </h2>
        <StatusBadge status={campaign.status} />
      </div>

      {/* Subject + Body */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Subject</label>
          <input
            type="text"
            value={editSubject}
            onChange={e => isEditable && setEditSubject(e.target.value)}
            readOnly={!isEditable}
            style={{
              height: 36,
              padding: '0 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: '0.875rem',
              outline: 'none',
              background: isEditable ? '#ffffff' : '#f8fafc',
              color: '#0f172a',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Body</label>
          <textarea
            value={editBody}
            onChange={e => isEditable && setEditBody(e.target.value)}
            readOnly={!isEditable}
            rows={12}
            style={{
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: '0.875rem',
              outline: 'none',
              background: isEditable ? '#ffffff' : '#f8fafc',
              resize: isEditable ? 'vertical' : 'none',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              color: '#0f172a',
            }}
          />
          {isEditable && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
              Write plain text. Separate paragraphs with a blank line. Use {'{{first_name}}'} to personalise.
            </p>
          )}
        </div>

        {isEditable && dirty && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                height: 36,
                padding: '0 16px',
                borderRadius: 6,
                border: 'none',
                background: saving ? '#94a3b8' : '#0f172a',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {saveMsg && <span style={{ fontSize: '0.875rem', color: '#15803d' }}>{saveMsg}</span>}
            {saveError && <span style={{ fontSize: '0.875rem', color: '#b91c1c' }}>{saveError}</span>}
          </div>
        )}
        {!dirty && saveMsg && <span style={{ fontSize: '0.875rem', color: '#15803d' }}>{saveMsg}</span>}
        {saveError && !dirty && <span style={{ fontSize: '0.875rem', color: '#b91c1c' }}>{saveError}</span>}
      </div>

      {/* Audience */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '0.875rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Audience</h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#0f172a' }}>
          <strong>{activeContacts}</strong> active contact{activeContacts !== 1 ? 's' : ''} will receive this campaign.
        </p>
      </div>

      {/* Send section */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Send</h3>

        {sendError && (
          <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, fontSize: '0.875rem', color: '#b91c1c' }}>
            {sendError}
          </div>
        )}

        {isSent && (
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#0f172a' }}>
            Sent to <strong>{sent}</strong>{failed > 0 ? `, ${failed} failed` : ''}.
            {campaign.sent_at && <> Completed {fmtDate(campaign.sent_at)}.</>}
          </p>
        )}

        {(isSending || isPartial) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#64748b' }}>
              <span>{sent} sent{failed > 0 ? `, ${failed} failed` : ''}</span>
              <span>{total > 0 ? `${sent} / ${total}` : ''}</span>
            </div>
            <ProgressBar value={sent} max={total} />
          </div>
        )}

        {isDraft && (
          <button
            onClick={handlePrepareAndSend}
            disabled={sending}
            style={{
              alignSelf: 'flex-start',
              height: 36,
              padding: '0 16px',
              borderRadius: 6,
              border: 'none',
              background: sending ? '#94a3b8' : '#0f172a',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: sending ? 'wait' : 'pointer',
            }}
          >
            {sending ? 'Preparing…' : 'Prepare & Send'}
          </button>
        )}

        {(isSending || isPartial) && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleContinueSending}
              disabled={sending}
              style={{
                height: 36,
                padding: '0 16px',
                borderRadius: 6,
                border: 'none',
                background: sending ? '#94a3b8' : '#0f172a',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: sending ? 'wait' : 'pointer',
              }}
            >
              {sending ? 'Sending…' : 'Continue Sending'}
            </button>
            {isPartial && failed > 0 && (
              <button
                onClick={handleRetryFailed}
                disabled={sending}
                style={{
                  height: 36,
                  padding: '0 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: sending ? '#94a3b8' : '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: sending ? 'wait' : 'pointer',
                }}
              >
                Retry Failed
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Campaigns Tab ────────────────────────────────────────────────────────────

function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [activeContacts, setActiveContacts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [cRes, ctRes] = await Promise.all([
        fetch('/api/admin/campaigns'),
        fetch('/api/admin/mailing-list/contacts'),
      ])
      if (!cRes.ok) throw new Error(`Failed to load campaigns (${cRes.status})`)
      const cData = await cRes.json()
      setCampaigns(cData.campaigns ?? [])
      if (ctRes.ok) {
        const ctData = await ctRes.json()
        setActiveContacts(ctData.stats?.active ?? 0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreated = (campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev])
    setShowNewForm(false)
    setSelectedCampaign(campaign)
  }

  const handleUpdated = (updated: Campaign) => {
    setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c))
    if (selectedCampaign?.id === updated.id) {
      setSelectedCampaign(updated)
    }
  }

  if (selectedCampaign) {
    return (
      <CampaignDetail
        campaign={selectedCampaign}
        activeContacts={activeContacts}
        onBack={() => setSelectedCampaign(null)}
        onUpdated={handleUpdated}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      {!showNewForm && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowNewForm(true)}
            style={{
              height: 36,
              padding: '0 16px',
              borderRadius: 6,
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + New Campaign
          </button>
        </div>
      )}

      {showNewForm && (
        <NewCampaignForm
          onCreated={handleCreated}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {error && (
        <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, fontSize: '0.875rem', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
          Loading campaigns…
        </div>
      ) : campaigns.length === 0 ? (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '40px 20px',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: '0.875rem',
        }}>
          No campaigns yet. Create your first one above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {campaigns.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCampaign(c)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#94a3b8')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9375rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.subject}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {c.status === 'sent' || c.status === 'partial' || c.status === 'sending'
                      ? `${c.sent_count} / ${c.total_count} sent${c.failed_count > 0 ? `, ${c.failed_count} failed` : ''}`
                      : 'Not sent yet'
                    }
                    {' · '}
                    {c.sent_at ? `Sent ${fmtDate(c.sent_at)}` : `Created ${fmtDate(c.created_at)}`}
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MailingListManager() {
  const [tab, setTab] = useState<Tab>('contacts')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid #e2e8f0',
        marginBottom: 24,
      }}>
        {(['contacts', 'campaigns'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              height: 40,
              padding: '0 20px',
              border: 'none',
              background: 'transparent',
              borderBottom: tab === t ? '2px solid #0f172a' : '2px solid transparent',
              color: tab === t ? '#0f172a' : '#94a3b8',
              fontSize: '0.875rem',
              fontWeight: tab === t ? 600 : 400,
              cursor: 'pointer',
              textTransform: 'capitalize',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'contacts' ? <ContactsTab /> : <CampaignsTab />}
    </div>
  )
}
