'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Registration } from '@/lib/types'
import { formatAmount } from '@/lib/types'

type Status = 'pending' | 'confirmed' | 'waitlist' | 'cancelled'

const STATUS_OPTS: { value: Status; label: string; color: string }[] = [
  { value: 'pending',   label: 'Pending',   color: 'var(--gold-400)' },
  { value: 'confirmed', label: 'Confirmed', color: '#22c55e' },
  { value: 'waitlist',  label: 'Waitlist',  color: '#a78bfa' },
  { value: 'cancelled', label: 'Cancelled', color: '#f87171' },
]

export function AdminDashboard({
  registrations: initial,
  totalDue,
  totalReceived,
  paymentSummaries,
}: {
  registrations: Registration[]
  totalDue: number
  totalReceived: number
  paymentSummaries: Record<string, { totalDue: number; totalPaid: number }>
}) {
  const router = useRouter()
  const [registrations, setRegistrations] = useState(initial)
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [allocating, setAllocating] = useState<string | null>(null)

  // Payment plan form state
  const [planTotal, setPlanTotal] = useState('')
  const [planNotes, setPlanNotes] = useState('')
  const [planSaving, setPlanSaving] = useState(false)
  const [planError, setPlanError] = useState('')
  const [planSuccess, setPlanSuccess] = useState('')

  // Status update state
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Payment reminder state
  const [remindingId, setRemindingId]     = useState<string | null>(null)
  const [remindedIds, setRemindedIds]     = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let list = registrations
    if (filterStatus !== 'all') list = list.filter(r => r.status === filterStatus)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(r =>
        `${r.first_name} ${r.surname} ${r.email}`.toLowerCase().includes(q)
      )
    }
    return list
  }, [registrations, filterStatus, search])

  // Resolve a "camp near" registration id to a display name for the detail view.
  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of registrations) m.set(r.id, `${r.first_name} ${r.surname}`.trim())
    return m
  }, [registrations])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: registrations.length }
    for (const r of registrations) c[r.status] = (c[r.status] ?? 0) + 1
    return c
  }, [registrations])

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    await createClient().auth.signOut()
    router.push('/')
  }

  const updateStatus = async (id: string, status: Status) => {
    setUpdatingId(id)
    await fetch('/api/admin/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setUpdatingId(null)
  }

  const sendReminder = async (id: string) => {
    setRemindingId(id)
    await fetch('/api/admin/payment-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registration_id: id }),
    })
    setRemindedIds(prev => new Set(prev).add(id))
    setRemindingId(null)
  }

  const openAllocate = (id: string) => {
    setAllocating(id)
    setPlanTotal('')
    setPlanNotes('')
    setPlanError('')
    setPlanSuccess('')
  }

  const savePaymentPlan = async () => {
    if (!allocating) return
    const total = parseFloat(planTotal)
    if (!planTotal || isNaN(total) || total <= 0) { setPlanError('Enter a valid total amount'); return }

    setPlanSaving(true)
    setPlanError('')
    const res = await fetch('/api/admin/payment-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration_id: allocating,
        total_amount: Math.round(total * 100),
        notes: planNotes,
      }),
    })
    const body = await res.json()
    if (!res.ok) { setPlanError(body.error ?? 'Save failed'); setPlanSaving(false); return }
    setPlanSuccess('Payment plan saved!')
    setPlanSaving(false)
    setTimeout(() => setAllocating(null), 1500)
  }

  return (
    <div className="adm-wrap">
      <div className="adm-top">
        <div>
          <h1 className="adm-title">SharkFest 2028 — Registrations</h1>
          <p className="adm-sub">{registrations.length} total registrations</p>
        </div>
        <div className="adm-top-actions">
          <div className="adm-export-group">
            <a href="/api/admin/export?format=csv"  className="adm-export-btn" download>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              CSV
            </a>
            <a href="/api/admin/export?format=xlsx" className="adm-export-btn" download>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              XLSX
            </a>
          </div>
          <Link href="/admin/members" className="btn btn-accent">Manage members</Link>
          <button className="mb-signout" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>

      {/* Payment summary */}
      {(() => {
        const outstanding = totalDue - totalReceived
        return (
          <div className="adm-summary">
            <div className="adm-stat">
              <span className="adm-stat-label">Total allocated</span>
              <span className="adm-stat-value">{formatAmount(totalDue)}</span>
              <span className="adm-stat-sub">across all payment plans</span>
            </div>
            <div className="adm-stat">
              <span className="adm-stat-label">Received</span>
              <span className="adm-stat-value adm-stat-value--received">{formatAmount(totalReceived)}</span>
              <span className="adm-stat-sub">confirmed payments</span>
            </div>
            <div className="adm-stat">
              <span className="adm-stat-label">Outstanding</span>
              <span className={`adm-stat-value ${outstanding > 0 ? 'adm-stat-value--outstanding' : 'adm-stat-value--zero'}`}>
                {formatAmount(outstanding)}
              </span>
              <span className="adm-stat-sub">{outstanding > 0 ? 'still to collect' : 'all paid up'}</span>
            </div>
          </div>
        )
      })()}

      {/* Filters */}
      <div className="adm-filters">
        <div className="adm-status-tabs">
          {[{ value: 'all', label: 'All', color: 'var(--grey-400)' }, ...STATUS_OPTS].map(s => (
            <button
              key={s.value}
              className={`adm-status-tab ${filterStatus === s.value ? 'adm-status-tab--active' : ''}`}
              onClick={() => setFilterStatus(s.value as Status | 'all')}
              style={filterStatus === s.value ? { borderColor: s.color, color: s.color } : {}}
            >
              {s.label}
              <span className="cg-tab-count">{counts[s.value] ?? 0}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          className="cu-input adm-search"
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Party</th>
              <th>Accommodation</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <>
                <tr
                  key={r.id}
                  className={`adm-row ${expanded === r.id ? 'adm-row--expanded' : ''}`}
                  onClick={() => setExpanded(e => e === r.id ? null : r.id)}
                >
                  <td className="adm-name">
                    {r.first_name} {r.surname}
                    <span className={`adm-year-tag${r.year !== 2028 ? ' adm-year-tag--alt' : ''}`}>{r.year}</span>
                  </td>
                  <td className="adm-email">{r.email}</td>
                  <td>{r.adults}A {r.kids > 0 ? `${r.kids}C` : ''}</td>
                  <td>{r.accommodation}{r.electric_hookup ? ' ⚡' : ''}</td>
                  <td>
                    <select
                      className="adm-status-select"
                      value={r.status}
                      style={{ color: STATUS_OPTS.find(s => s.value === r.status)?.color ?? 'inherit' }}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); updateStatus(r.id, e.target.value as Status) }}
                      disabled={updatingId === r.id}
                    >
                      {STATUS_OPTS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="adm-date">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td onClick={e => e.stopPropagation()} className="adm-actions-cell">
                    <button className="adm-action-btn" onClick={() => openAllocate(r.id)}>
                      £ Allocate
                    </button>
                    {(() => {
                      const ps = paymentSummaries[r.id]
                      if (!ps || ps.totalDue <= ps.totalPaid) return null
                      const outstanding = ps.totalDue - ps.totalPaid
                      const sent = remindedIds.has(r.id)
                      return (
                        <button
                          className={`adm-remind-btn ${sent ? 'adm-remind-btn--sent' : ''}`}
                          onClick={() => !sent && sendReminder(r.id)}
                          disabled={remindingId === r.id || sent}
                          title={`Send payment reminder — £${(outstanding / 100).toFixed(2)} outstanding`}
                        >
                          {remindingId === r.id ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                          ) : sent ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>
                          )}
                          {sent ? 'Sent' : 'Remind'}
                        </button>
                      )
                    })()}
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr key={`${r.id}-detail`} className="adm-detail-row">
                    <td colSpan={7}>
                      <div className="adm-detail">
                        <dl className="mb-detail-grid">
                          <div><dt>Mobile</dt><dd>{r.mobile}</dd></div>
                          {r.vehicle_reg && <div><dt>Vehicle</dt><dd>{r.vehicle_reg}</dd></div>}
                          {(() => {
                            const near = [r.camp_near_1, r.camp_near_2]
                              .filter((id): id is string => !!id)
                              .map(id => nameById.get(id) ?? 'Unknown')
                            return near.length > 0 ? (
                              <div><dt>Camp near</dt><dd>{near.join(', ')}</dd></div>
                            ) : null
                          })()}
                          {r.notes && <div className="mb-full"><dt>Notes</dt><dd>{r.notes}</dd></div>}
                        </dl>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="adm-empty">No registrations found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment plan modal */}
      {allocating && (
        <div className="adm-modal-backdrop" onClick={() => setAllocating(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-head">
              <div>
                <h2 className="adm-modal-title">Allocate payment plan</h2>
                {(() => {
                  const reg = registrations.find(r => r.id === allocating)
                  return reg ? (
                    <p className="adm-modal-sub">{reg.first_name} {reg.surname} · {reg.email}</p>
                  ) : null
                })()}
              </div>
              <button className="adm-modal-close" onClick={() => setAllocating(null)} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="adm-modal-body">
              {planError && (
                <div className="auth-error">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {planError}
                </div>
              )}
              {planSuccess && (
                <div className="mb-banner mb-banner--success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                  {planSuccess}
                </div>
              )}

              <div className="adm-plan-fields">
                <div className="cu-field">
                  <label className="cu-label">Total cost (£) *</label>
                  <div className="adm-amount-wrap">
                    <span className="adm-amount-prefix">£</span>
                    <input type="number" className="cu-input adm-amount-input" min="0" step="0.01" placeholder="0.00"
                      value={planTotal} onChange={e => setPlanTotal(e.target.value)} />
                  </div>
                </div>
                <div className="cu-field">
                  <label className="cu-label">Notes</label>
                  <input type="text" className="cu-input" placeholder="e.g. Tent pitch + electric hookup"
                    value={planNotes} onChange={e => setPlanNotes(e.target.value)} />
                </div>
              </div>

              <div className="adm-deposit-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                A £50 deposit will be created automatically. The attendee can then pay the remaining balance in amounts of their choice.
              </div>
            </div>

            <div className="adm-modal-actions">
              <button className="reg-back-btn" onClick={() => setAllocating(null)}>Cancel</button>
              <button className="btn btn-accent" onClick={savePaymentPlan} disabled={planSaving}>
                {planSaving ? 'Saving…' : 'Save payment plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
