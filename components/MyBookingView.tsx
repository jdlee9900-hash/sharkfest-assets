'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Registration, PaymentPlan, Instalment, Payment } from '@/lib/types'
import { formatAmount } from '@/lib/types'
import { getEvent } from '@/lib/events'
import { CampNearPicker, type Picked } from '@/components/CampNearPicker'

interface Props {
  user: { email?: string }
  registration: Registration | null
  paymentPlan: PaymentPlan | null
  instalments: Instalment[]
  payments: Payment[]
  campNearInitial: Picked[]
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
        Choose up to two people you’d like to be pitched near. You can change this any
        time — handy if you booked early before your friends had registered.
      </p>

      <CampNearPicker
        year={event.year}
        eventName={event.name}
        picked={picked}
        onChange={p => { setPicked(p); setDone(false) }}
        excludeId={registration.id}
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

export function MyBookingView({ user, registration, paymentPlan, instalments, payments, campNearInitial }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentResult = searchParams.get('payment')

  const [paying, setPaying]           = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [payError, setPayError]       = useState('')

  const paidIds = new Set(
    payments.filter(p => p.status === 'paid' && p.instalment_id).map(p => p.instalment_id!)
  )
  const totalPaid   = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const balance     = paymentPlan ? paymentPlan.total_amount - totalPaid : null
  const depositIns  = instalments.find(i => i.label === 'Deposit')
  const depositPaid = depositIns ? paidIds.has(depositIns.id) : false

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

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    await createClient().auth.signOut()
    router.push('/')
  }

  return (
    <div className="mb-wrap">
      {/* Header */}
      <div className="mb-header">
        <div>
          <h1 className="mb-title">My Booking</h1>
          <p className="mb-email">{user.email}</p>
        </div>
        <button className="mb-signout" onClick={handleSignOut}>Sign out</button>
      </div>

      {/* Payment result banners */}
      {paymentResult === 'success' && (
        <div className="mb-banner mb-banner--success" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          Payment received — thank you!
        </div>
      )}
      {paymentResult === 'cancelled' && (
        <div className="mb-banner mb-banner--warn" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Payment cancelled — you can try again below.
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
          {/* Booking summary */}
          <div className="mb-card">
            <div className="mb-card-head">
              <h2 className="mb-card-title">Booking details</h2>
              <span className="mb-status-badge" style={{ background: STATUS_COLORS[registration.status] ?? '#888' }}>
                {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
              </span>
            </div>
            <dl className="mb-detail-grid">
              <div><dt>Name</dt><dd>{registration.first_name} {registration.surname}</dd></div>
              <div><dt>Email</dt><dd>{registration.email}</dd></div>
              <div><dt>Mobile</dt><dd>{registration.mobile}</dd></div>
              <div><dt>Adults</dt><dd>{registration.adults}</dd></div>
              <div><dt>Children</dt><dd>{registration.kids}</dd></div>
              <div><dt>Accommodation</dt><dd>{registration.accommodation}{registration.electric_hookup ? ' + Electric' : ''}</dd></div>
              {registration.vehicle_reg && <div><dt>Vehicle</dt><dd>{registration.vehicle_reg}</dd></div>}
              {registration.notes && <div className="mb-full"><dt>Notes</dt><dd>{registration.notes}</dd></div>}
            </dl>
          </div>

          {/* Camp near — editable */}
          <CampNearCard registration={registration} initial={campNearInitial} />

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

              {/* Payment options — available whenever there's a balance to pay */}
              {balance !== null && balance > 0 && (
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
              <p style={{ color: 'var(--grey-400)', marginTop: '0.5rem', fontSize: '0.9375rem' }}>
                Your payment plan hasn&apos;t been allocated yet. We&apos;ll email you once it&apos;s ready, usually within 7 days of registering.
              </p>
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
