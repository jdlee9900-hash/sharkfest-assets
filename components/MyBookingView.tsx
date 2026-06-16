'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Registration, PaymentPlan, Instalment, Payment, AccommodationType } from '@/lib/types'
import { formatAmount } from '@/lib/types'
import { getEvent } from '@/lib/events'
import { CampNearPicker, type Picked } from '@/components/CampNearPicker'
import { PartnerEmailCard } from '@/components/PartnerEmailCard'
import { SignOutButton } from '@/components/SignOutButton'

interface Props {
  user: { email?: string }
  registration: Registration | null
  paymentPlan: PaymentPlan | null
  instalments: Instalment[]
  payments: Payment[]
  campNearInitial: Picked[]
  isPartner?: boolean
}

const ACCOMMODATION_TYPES: AccommodationType[] = ['Tent', 'Caravan', 'Mobile Home', 'Campervan']

interface EditState {
  first_name: string
  surname: string
  mobile: string
  adults: number
  kids: number
  accommodation: AccommodationType
  electric_hookup: boolean
  vehicle_reg: string
  notes: string
}

function BookingDetailsCard({ registration, isPartner }: { registration: Registration; isPartner: boolean }) {
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [saved, setSaved]       = useState<Registration>(registration)
  const [form, setForm]         = useState<EditState>({
    first_name:     registration.first_name,
    surname:        registration.surname,
    mobile:         registration.mobile,
    adults:         registration.adults,
    kids:           registration.kids,
    accommodation:  registration.accommodation,
    electric_hookup: registration.electric_hookup,
    vehicle_reg:    registration.vehicle_reg ?? '',
    notes:          registration.notes ?? '',
  })

  const set = <K extends keyof EditState>(k: K, v: EditState[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleEdit = () => { setEditing(true); setError('') }

  const handleCancel = () => {
    setEditing(false)
    setError('')
    setForm({
      first_name:      saved.first_name,
      surname:         saved.surname,
      mobile:          saved.mobile,
      adults:          saved.adults,
      kids:            saved.kids,
      accommodation:   saved.accommodation,
      electric_hookup: saved.electric_hookup,
      vehicle_reg:     saved.vehicle_reg ?? '',
      notes:           saved.notes ?? '',
    })
  }

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/my-booking/details', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not save changes')
      setSaved(data)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-card">
      <div className="mb-card-head">
        <h2 className="mb-card-title">Booking details</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span className="mb-status-badge" style={{ background: STATUS_COLORS[saved.status] ?? '#888' }}>
            {saved.status.charAt(0).toUpperCase() + saved.status.slice(1)}
          </span>
          {!isPartner && !editing && (
            <button className="mb-edit-btn" onClick={handleEdit}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
              Edit
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="auth-error" role="alert" style={{ marginBottom: '1rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {editing ? (
        <div className="mb-edit-form">
          <div className="mb-edit-row">
            <div className="mb-edit-field">
              <label className="cu-label">First name</label>
              <input className="cu-input" value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
            </div>
            <div className="mb-edit-field">
              <label className="cu-label">Surname</label>
              <input className="cu-input" value={form.surname} onChange={e => set('surname', e.target.value)} required />
            </div>
          </div>
          <div className="mb-edit-field">
            <label className="cu-label">Mobile</label>
            <input className="cu-input" type="tel" value={form.mobile} onChange={e => set('mobile', e.target.value)} required />
          </div>
          <div className="mb-edit-row">
            <div className="mb-edit-field">
              <label className="cu-label">Adults</label>
              <input className="cu-input" type="number" min={1} max={20} value={form.adults} onChange={e => set('adults', Number(e.target.value))} />
            </div>
            <div className="mb-edit-field">
              <label className="cu-label">Children</label>
              <input className="cu-input" type="number" min={0} max={20} value={form.kids} onChange={e => set('kids', Number(e.target.value))} />
            </div>
          </div>
          <div className="mb-edit-row">
            <div className="mb-edit-field">
              <label className="cu-label">Accommodation</label>
              <select className="cu-input" value={form.accommodation} onChange={e => set('accommodation', e.target.value as AccommodationType)}>
                {ACCOMMODATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="mb-edit-field mb-edit-field--check">
              <label className="mb-check-label">
                <input type="checkbox" checked={form.electric_hookup} onChange={e => set('electric_hookup', e.target.checked)} />
                Electric hookup
              </label>
            </div>
          </div>
          <div className="mb-edit-field">
            <label className="cu-label">Vehicle reg <span className="cu-label-opt">(optional)</span></label>
            <input className="cu-input" value={form.vehicle_reg} onChange={e => set('vehicle_reg', e.target.value)} placeholder="e.g. AB12 CDE" />
          </div>
          <div className="mb-edit-field">
            <label className="cu-label">Notes <span className="cu-label-opt">(optional)</span></label>
            <textarea className="cu-input cu-textarea" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Anything we should know…" />
          </div>
          <div className="mb-edit-actions">
            <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button className="btn mb-cancel-btn" onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <dl className="mb-detail-grid">
          <div><dt>Name</dt><dd>{saved.first_name} {saved.surname}</dd></div>
          <div><dt>Email</dt><dd>{saved.email}</dd></div>
          <div><dt>Mobile</dt><dd>{saved.mobile}</dd></div>
          <div><dt>Adults</dt><dd>{saved.adults}</dd></div>
          <div><dt>Children</dt><dd>{saved.kids}</dd></div>
          <div><dt>Accommodation</dt><dd>{saved.accommodation}{saved.electric_hookup ? ' + Electric' : ''}</dd></div>
          {saved.food_preference && <div><dt>Food preference</dt><dd>{saved.food_preference}</dd></div>}
          {saved.estimated_total != null && <div><dt>Estimated total</dt><dd>{formatAmount(saved.estimated_total)}</dd></div>}
          {saved.vehicle_reg && <div><dt>Vehicle</dt><dd>{saved.vehicle_reg}</dd></div>}
          {saved.notes && <div className="mb-full"><dt>Notes</dt><dd>{saved.notes}</dd></div>}
        </dl>
      )}
    </div>
  )
}

// Editable "camp near" card — lets a registrant add/change who they'd like to be
// pitched near after booking (early bookers often had no one to choose at sign-up).
function CampNearCard({ registration, initial }: { registration: Registration; initial: Picked[] }) {
  const event = getEvent(registration.year)
  const [picked, setPicked] = useState<Picked[]>(initial)
  const [saved, setSaved]   = useState<Picked[]>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [done, setDone]     = useState(false)

  const dirty = picked.map(p => p.id).join(',') !== saved.map(p => p.id).join(',')

  const handleSave = async () => {
    setSaving(true); setError(''); setDone(false)
    try {
      const res = await fetch('/api/my-booking/camp-near', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camp_near: picked.map(p => p.id) }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Could not save your changes')
      const next: Picked[] = Array.isArray(body.camp_near) ? body.camp_near : picked
      setPicked(next); setSaved(next); setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-card">
      <h2 className="mb-card-title">Camp near</h2>
      <p className="mb-camp-intro">
        Choose one family you’d like to be pitched near. You can change this any
        time — handy if you booked early before your friends had registered.
      </p>

      <CampNearPicker
        year={event.year}
        eventName={event.name}
        picked={picked}
        onChange={p => { setPicked(p); setDone(false) }}
        excludeId={registration.id}
        max={1}
      />

      {error && (
        <div className="auth-error" role="alert" style={{ marginTop: '0.75rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      <div className="mb-camp-actions">
        <button className="btn btn-accent mb-pay-btn" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? 'Saving…' : 'Save camp-near choices'}
        </button>
        {done && !dirty && (
          <span className="mb-camp-saved">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            Saved
          </span>
        )}
      </div>
    </div>
  )
}



// Only ever hand the browser off to a genuine Stripe Checkout URL, even though
// the URL comes from our own API — defends against a tampered/unexpected response.
function redirectToStripe(url: unknown) {
  if (typeof url !== 'string') throw new Error('Payment setup failed')
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' || !/(^|\.)stripe\.com$/.test(parsed.hostname)) {
    throw new Error('Payment setup failed')
  }
  window.location.href = url
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'var(--gold-400)',
  confirmed: '#22c55e',
  waitlist:  '#a78bfa',
  cancelled: '#f87171',
}


export function MyBookingView({ user, registration, paymentPlan, instalments, payments, campNearInitial, isPartner = false }: Props) {
  const searchParams = useSearchParams()
  const paymentResult = searchParams.get('payment')

  const [paying, setPaying]           = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [payError, setPayError]       = useState('')
  const [bannerDismissed, setBannerDismissed] = useState(false)

  // Auto-dismiss the payment result banner after 6s
  useEffect(() => {
    if (!paymentResult) return
    const t = setTimeout(() => setBannerDismissed(true), 6_000)
    return () => clearTimeout(t)
  }, [paymentResult])

  const paidIds = new Set(
    payments.filter(p => p.status === 'paid' && p.instalment_id).map(p => p.instalment_id!)
  )
  const totalPaid   = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const balance     = paymentPlan ? paymentPlan.total_amount - totalPaid : null
  const depositIns  = instalments.find(i => i.label === 'Deposit')
  const depositPaid = depositIns ? paidIds.has(depositIns.id) : false

  const isInstalmentPlan = registration?.payment_method === 'instalments'
  const scheduleInstalments = isInstalmentPlan
    ? instalments.filter(i => i.label.startsWith('Instalment'))
    : []
  const todayIso = new Date().toISOString().slice(0, 10)

  const handlePay = async (instalmentId: string) => {
    setPaying(instalmentId)
    setPayError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instalment_id: instalmentId }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Payment setup failed')
      redirectToStripe(body.url)
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Something went wrong')
      setPaying(null)
    }
  }

  // Pay an arbitrary amount (in pence) towards the balance. `key` drives the
  // per-button loading state ('custom', 'full', …).
  const payAmount = async (pence: number, key: string) => {
    if (!pence || pence < 100) { setPayError('Please enter an amount of at least £1'); return }
    setPaying(key)
    setPayError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: pence }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Payment setup failed')
      redirectToStripe(body.url)
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Something went wrong')
      setPaying(null)
    }
  }

  const handleCustomPay = () => payAmount(Math.round(parseFloat(customAmount) * 100), 'custom')

  return (
    <div className="mb-wrap">
      {/* Header */}
      <div className="mb-header">
        <div>
          <h1 className="mb-title">My Booking</h1>
          <p className="mb-email">{user.email}</p>
        </div>
        <SignOutButton>Sign out</SignOutButton>
      </div>

      {/* Payment result banners — auto-dismiss after 6s, or tap × to close */}
      {!bannerDismissed && paymentResult === 'success' && (
        <div className="mb-banner mb-banner--success" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          Payment received — thank you! Your balance below has been updated.
          <button className="mb-banner-close" aria-label="Dismiss" onClick={() => setBannerDismissed(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
      {!bannerDismissed && paymentResult === 'cancelled' && (
        <div className="mb-banner mb-banner--warn" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Payment cancelled — you can try again below.
          <button className="mb-banner-close" aria-label="Dismiss" onClick={() => setBannerDismissed(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {isPartner && registration && (
        <div className="mb-banner mb-banner--partner" role="note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          You have shared access to {registration.first_name} {registration.surname}&apos;s booking.
        </div>
      )}

      {!registration ? (
        <div className="mb-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h4"/></svg>
          <p>No booking found for this email address.</p>
          <a href="/register" className="btn btn-accent" style={{ marginTop: '1rem' }}>Register now</a>
        </div>
      ) : (
        <>
          {/* Booking summary — inline-editable */}
          <BookingDetailsCard registration={registration} isPartner={isPartner} />

          {/* Camp near — editable */}
          <CampNearCard registration={registration} initial={campNearInitial} />

          {/* Partner / shared access — only the primary holder can manage this */}
          {!isPartner && (
            <PartnerEmailCard initial={(registration as Registration & { partner_email?: string | null }).partner_email ?? null} />
          )}

          {/* Payment section */}
          {paymentPlan ? (
            <div className="mb-card">
              <h2 className="mb-card-title" style={{ marginBottom: '1.25rem' }}>Payments</h2>

              {/* Balance overview */}
              <div className="mb-balance-row">
                <div className="mb-balance-item">
                  <span className="mb-balance-label">Total cost</span>
                  <span className="mb-balance-value">{formatAmount(paymentPlan.total_amount)}</span>
                </div>
                <div className="mb-balance-divider" aria-hidden="true" />
                <div className="mb-balance-item">
                  <span className="mb-balance-label">Paid</span>
                  <span className="mb-balance-value" style={{ color: '#22c55e' }}>{formatAmount(totalPaid)}</span>
                </div>
                <div className="mb-balance-divider" aria-hidden="true" />
                <div className="mb-balance-item">
                  <span className="mb-balance-label">Remaining</span>
                  <span className="mb-balance-value" style={{ color: balance === 0 ? '#22c55e' : 'var(--gold-500, #b7860b)' }}>
                    {formatAmount(balance ?? 0)}
                  </span>
                </div>
              </div>

              {paymentPlan.member_discount ? (
                <div className="mb-member-note">
                  <span aria-hidden="true">🎟️</span>
                  Member price applied — you saved {formatAmount(paymentPlan.member_discount)}
                  {paymentPlan.member_discount_pct ? ` (${paymentPlan.member_discount_pct}% member discount)` : ''}.
                </div>
              ) : null}

              {paymentPlan.notes && <p className="mb-plan-notes">{paymentPlan.notes}</p>}

              {payError && (
                <div className="auth-error" role="alert" style={{ marginBottom: '1rem' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {payError}
                </div>
              )}

              {/* Payment options */}
              {balance !== null && balance > 0 && isInstalmentPlan && scheduleInstalments.length > 0 && (
                <>
                  <p className="mb-custom-title" style={{ marginBottom: '0.75rem' }}>Instalment schedule</p>
                  <div className="mb-instalments">
                    {scheduleInstalments.map(ins => {
                      const isPaid = paidIds.has(ins.id)
                      const isOverdue = ins.due_date && ins.due_date < todayIso && !isPaid
                      return (
                        <div
                          key={ins.id}
                          className={`mb-instalment ${isPaid ? 'mb-instalment--paid' : ''}`}
                          style={isOverdue ? { borderColor: '#fca5a5', background: '#fff5f5' } : undefined}
                        >
                          <div className="mb-ins-info">
                            <span className="mb-ins-label">{ins.label}</span>
                            <span className="mb-ins-due">
                              Due {ins.due_date ? new Date(ins.due_date + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                              {isOverdue && <span style={{ color: '#dc2626', marginLeft: '0.4rem', fontWeight: 600 }}>Overdue</span>}
                            </span>
                          </div>
                          <div className="mb-ins-right">
                            <span className="mb-ins-amount">{formatAmount(ins.amount)}</span>
                            {isPaid ? (
                              <span className="mb-ins-paid">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                                Paid
                              </span>
                            ) : (
                              <button
                                className="btn btn-accent mb-pay-btn"
                                onClick={() => handlePay(ins.id)}
                                disabled={paying === ins.id}
                              >
                                {paying === ins.id ? 'Redirecting…' : 'Pay now'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {balance !== null && balance > 0 && !isInstalmentPlan && (
                <>
                  {/* Deposit prompt — secures the place */}
                  {depositIns && !depositPaid && (
                    <div className="mb-deposit-card">
                      <div>
                        <p className="mb-deposit-title">Deposit required to secure your booking</p>
                        <p className="mb-deposit-sub">
                          Pay a {formatAmount(depositIns.amount)} deposit to confirm your place at SharkFest 2027 — or pay more below.
                        </p>
                      </div>
                      <button
                        className="btn btn-accent mb-pay-btn"
                        onClick={() => handlePay(depositIns.id)}
                        disabled={paying === depositIns.id}
                      >
                        {paying === depositIns.id ? 'Redirecting…' : `Pay ${formatAmount(depositIns.amount)} deposit`}
                      </button>
                    </div>
                  )}

                  {/* Full balance or a custom amount */}
                  <div className="mb-custom-pay">
                    <p className="mb-custom-title">
                      {depositIns && !depositPaid ? 'Or pay more towards your balance' : 'Pay towards your balance'}
                    </p>
                    <p className="mb-custom-sub">
                      You have {formatAmount(balance)} remaining. Pay it all in one go, or choose a custom amount.
                    </p>

                    <button
                      className="btn btn-accent mb-pay-btn mb-pay-full"
                      onClick={() => payAmount(balance, 'full')}
                      disabled={paying === 'full'}
                    >
                      {paying === 'full' ? 'Redirecting…' : `Pay full balance — ${formatAmount(balance)}`}
                    </button>

                    <div className="mb-pay-or"><span>or a custom amount</span></div>

                    <div className="mb-custom-input-row">
                      <div className="adm-amount-wrap" style={{ flex: 1 }}>
                        <span className="adm-amount-prefix">£</span>
                        <input
                          type="number"
                          className="cu-input adm-amount-input"
                          placeholder="0.00"
                          min="1"
                          step="0.01"
                          max={(balance / 100).toFixed(2)}
                          value={customAmount}
                          onChange={e => setCustomAmount(e.target.value)}
                        />
                      </div>
                      <button
                        className="btn btn-dark mb-pay-btn"
                        onClick={handleCustomPay}
                        disabled={paying === 'custom' || !customAmount}
                      >
                        {paying === 'custom' ? 'Redirecting…' : 'Pay now'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {balance === 0 && (
                <div className="mb-paid-full">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                  Paid in full — see you at SharkFest 2027!
                </div>
              )}
            </div>
          ) : (
            <div className="mb-card mb-card--muted">
              <h2 className="mb-card-title">Payments</h2>
              {registration?.payment_method === 'instalments' ? (
                <p style={{ color: 'var(--grey-400)', marginTop: '0.5rem', fontSize: '0.9375rem' }}>
                  You&apos;ve chosen to pay in 3 equal instalments. Once we&apos;ve reviewed your booking we&apos;ll confirm the amounts and due dates — usually within 7 days.
                </p>
              ) : (
                <p style={{ color: 'var(--grey-400)', marginTop: '0.5rem', fontSize: '0.9375rem' }}>
                  Your payment plan hasn&apos;t been allocated yet. We&apos;ll email you once it&apos;s ready, usually within 7 days of registering.
                </p>
              )}
            </div>
          )}

          {/* Payment history */}
          {payments.filter(p => p.status === 'paid').length > 0 && (
            <div className="mb-card">
              <h2 className="mb-card-title">Payment history</h2>
              <table className="mb-pay-table">
                <thead>
                  <tr><th>Date</th><th>Description</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {payments.filter(p => p.status === 'paid').map(p => {
                    const ins = instalments.find(i => i.id === p.instalment_id)
                    return (
                      <tr key={p.id}>
                        <td>{p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                        <td>{ins?.label ?? 'Balance payment'}</td>
                        <td>{formatAmount(p.amount)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
