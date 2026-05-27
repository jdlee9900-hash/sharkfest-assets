'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Registration } from '@/lib/types'
import { formatAmount } from '@/lib/types'

type Status = 'pending' | 'confirmed' | 'waitlist' | 'cancelled'

interface InstalmentRow { label: string; amount: string; due_date: string }

const STATUS_OPTS: { value: Status; label: string; color: string }[] = [
  { value: 'pending',   label: 'Pending',   color: 'var(--gold-400)' },
  { value: 'confirmed', label: 'Confirmed', color: '#22c55e' },
  { value: 'waitlist',  label: 'Waitlist',  color: '#a78bfa' },
  { value: 'cancelled', label: 'Cancelled', color: '#f87171' },
]

export function AdminDashboard({ registrations: initial }: { registrations: Registration[] }) {
  const router = useRouter()
  const [registrations, setRegistrations] = useState(initial)
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [allocating, setAllocating] = useState<string | null>(null)

  // Payment plan form state
  const [planTotal, setPlanTotal] = useState('')
  const [planNotes, setPlanNotes] = useState('')
  const [planInstalments, setPlanInstalments] = useState<InstalmentRow[]>([
    { label: 'Deposit', amount: '', due_date: '' },
    { label: 'Final payment', amount: '', due_date: '' },
  ])
  const [planSaving, setPlanSaving] = useState(false)
  const [planError, setPlanError] = useState('')
  const [planSuccess, setPlanSuccess] = useState('')

  // Status update state
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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

  const openAllocate = (id: string) => {
    setAllocating(id)
    setPlanTotal('')
    setPlanNotes('')
    setPlanInstalments([
      { label: 'Deposit', amount: '', due_date: '' },
      { label: 'Final payment', amount: '', due_date: '' },
    ])
    setPlanError('')
    setPlanSuccess('')
  }

  const addInstalment = () =>
    setPlanInstalments(prev => [...prev, { label: '', amount: '', due_date: '' }])

  const removeInstalment = (i: number) =>
    setPlanInstalments(prev => prev.filter((_, j) => j !== i))

  const patchInstalment = (i: number, key: keyof InstalmentRow, value: string) =>
    setPlanInstalments(prev => prev.map((ins, j) => j === i ? { ...ins, [key]: value } : ins))

  const savePaymentPlan = async () => {
    if (!allocating) return
    const total = parseFloat(planTotal)
    if (!planTotal || isNaN(total) || total <= 0) { setPlanError('Enter a valid total amount'); return }

    const rows = planInstalments.filter(i => i.label || i.amount)
    const sumPence = rows.reduce((s, i) => s + Math.round(parseFloat(i.amount || '0') * 100), 0)
    const totalPence = Math.round(total * 100)
    if (rows.length > 0 && sumPence !== totalPence) {
      setPlanError(`Instalment total (${formatAmount(sumPence)}) must equal plan total (${formatAmount(totalPence)})`)
      return
    }

    setPlanSaving(true)
    setPlanError('')
    const res = await fetch('/api/admin/payment-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration_id: allocating,
        total_amount: totalPence,
        notes: planNotes,
        instalments: rows.map(i => ({
          label: i.label,
          amount: Math.round(parseFloat(i.amount) * 100),
          due_date: i.due_date || null,
        })),
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
        <button className="mb-signout" onClick={handleSignOut}>Sign out</button>
      </div>

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
                  <td className="adm-name">{r.first_name} {r.surname}</td>
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
                  <td onClick={e => e.stopPropagation()}>
                    <button className="adm-action-btn" onClick={() => openAllocate(r.id)}>
                      £ Allocate
                    </button>
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr key={`${r.id}-detail`} className="adm-detail-row">
                    <td colSpan={7}>
                      <div className="adm-detail">
                        <dl className="mb-detail-grid">
                          <div><dt>Mobile</dt><dd>{r.mobile}</dd></div>
                          {r.vehicle_reg && <div><dt>Vehicle</dt><dd>{r.vehicle_reg}</dd></div>}
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
              <h2 className="adm-modal-title">Allocate payment plan</h2>
              <button className="lb-close" style={{ position: 'static' }} onClick={() => setAllocating(null)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {(() => {
              const reg = registrations.find(r => r.id === allocating)
              return reg ? (
                <p className="adm-modal-sub">{reg.first_name} {reg.surname} · {reg.email}</p>
              ) : null
            })()}

            {planError && (
              <div className="auth-error" style={{ marginBottom: '1rem' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {planError}
              </div>
            )}
            {planSuccess && (
              <div className="mb-banner mb-banner--success" style={{ marginBottom: '1rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                {planSuccess}
              </div>
            )}

            <div className="reg-row">
              <div className="cu-field" style={{ flex: 1 }}>
                <label className="cu-label">Total amount (£) *</label>
                <input type="number" className="cu-input" min="0" step="0.01" placeholder="120.00"
                  value={planTotal} onChange={e => setPlanTotal(e.target.value)} />
              </div>
              <div className="cu-field" style={{ flex: 2 }}>
                <label className="cu-label">Notes</label>
                <input type="text" className="cu-input" placeholder="e.g. Tent pitch + electric"
                  value={planNotes} onChange={e => setPlanNotes(e.target.value)} />
              </div>
            </div>

            <p className="cu-label" style={{ marginBottom: '0.5rem', marginTop: '0.25rem' }}>Instalments</p>
            {planInstalments.map((ins, i) => (
              <div key={i} className="adm-ins-row">
                <input type="text" className="cu-input adm-ins-label" placeholder="Label"
                  value={ins.label} onChange={e => patchInstalment(i, 'label', e.target.value)} />
                <input type="number" className="cu-input adm-ins-amount" placeholder="£0.00" min="0" step="0.01"
                  value={ins.amount} onChange={e => patchInstalment(i, 'amount', e.target.value)} />
                <input type="date" className="cu-input adm-ins-date"
                  value={ins.due_date} onChange={e => patchInstalment(i, 'due_date', e.target.value)} />
                <button className="cu-remove" onClick={() => removeInstalment(i)} aria-label="Remove instalment">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}

            <button className="adm-add-ins" onClick={addInstalment}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Add instalment
            </button>

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
