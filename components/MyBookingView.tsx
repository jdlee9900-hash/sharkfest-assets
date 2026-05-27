'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Registration, PaymentPlan, Instalment, Payment } from '@/lib/types'
import { formatAmount } from '@/lib/types'

interface Props {
  user: { email?: string }
  registration: Registration | null
  paymentPlan: PaymentPlan | null
  instalments: Instalment[]
  payments: Payment[]
}

function paidInstalments(instalments: Instalment[], payments: Payment[]): Set<string> {
  return new Set(
    payments
      .filter(p => p.status === 'paid' && p.instalment_id)
      .map(p => p.instalment_id!)
  )
}

export function MyBookingView({ user, registration, paymentPlan, instalments, payments }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentResult = searchParams.get('payment')

  const [paying, setPaying] = useState<string | null>(null)
  const [payError, setPayError] = useState('')

  const paid = paidInstalments(instalments, payments)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const balance = paymentPlan ? paymentPlan.total_amount - totalPaid : null

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
      window.location.href = body.url
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Something went wrong')
      setPaying(null)
    }
  }

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    await createClient().auth.signOut()
    router.push('/')
  }

  const STATUS_COLORS: Record<string, string> = {
    pending:   'var(--gold-400)',
    confirmed: '#22c55e',
    waitlist:  '#a78bfa',
    cancelled: '#f87171',
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

      {/* Payment result banner */}
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
          {/* Registration summary */}
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

          {/* Payment plan */}
          {paymentPlan ? (
            <div className="mb-card">
              <div className="mb-card-head">
                <h2 className="mb-card-title">Payment plan</h2>
                <div className="mb-balance">
                  <span className="mb-balance-label">Balance remaining</span>
                  <span className="mb-balance-amount" style={{ color: balance === 0 ? '#22c55e' : 'var(--gold-400)' }}>
                    {formatAmount(balance ?? 0)}
                  </span>
                </div>
              </div>

              {paymentPlan.notes && <p className="mb-plan-notes">{paymentPlan.notes}</p>}

              {payError && (
                <div className="auth-error" role="alert" style={{ marginBottom: '1rem' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {payError}
                </div>
              )}

              <div className="mb-instalments">
                {instalments.map(ins => {
                  const isPaid = paid.has(ins.id)
                  return (
                    <div key={ins.id} className={`mb-instalment ${isPaid ? 'mb-instalment--paid' : ''}`}>
                      <div className="mb-ins-info">
                        <span className="mb-ins-label">{ins.label}</span>
                        {ins.due_date && (
                          <span className="mb-ins-due">
                            Due {new Date(ins.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div className="mb-ins-right">
                        <span className="mb-ins-amount">{formatAmount(ins.amount)}</span>
                        {isPaid ? (
                          <span className="mb-ins-paid">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                            Paid
                          </span>
                        ) : (
                          <button
                            className="btn btn-accent mb-pay-btn"
                            onClick={() => handlePay(ins.id)}
                            disabled={paying === ins.id}
                          >
                            {paying === ins.id ? 'Redirecting…' : `Pay ${formatAmount(ins.amount)}`}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {instalments.length === 0 && (
                <p className="mb-plan-notes" style={{ color: 'var(--grey-400)' }}>
                  No instalment schedule set yet — we&apos;ll be in touch.
                </p>
              )}

              <div className="mb-total-row">
                <span>Total</span>
                <span>{formatAmount(paymentPlan.total_amount)}</span>
              </div>
            </div>
          ) : (
            <div className="mb-card mb-card--muted">
              <h2 className="mb-card-title">Payment plan</h2>
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
                  <tr><th>Date</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {payments.filter(p => p.status === 'paid').map(p => (
                    <tr key={p.id}>
                      <td>{p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td>{formatAmount(p.amount)}</td>
                      <td><span className="mb-paid-badge">Paid</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
