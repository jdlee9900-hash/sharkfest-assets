'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MembershipStatus } from '@/lib/types'

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null

export function AdminCancelButton({
  id, status, synthetic, periodEnd, cancelAtPeriodEnd,
}: {
  id: string
  status: MembershipStatus
  synthetic: boolean
  periodEnd: string | null
  cancelAtPeriodEnd: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (status === 'canceled') return <span style={{ color: 'var(--grey-400)' }}>—</span>

  // Paid sub already set to lapse — nothing more to do, just show when.
  if (cancelAtPeriodEnd && !synthetic) {
    const ends = fmtDate(periodEnd)
    return <span style={{ color: 'var(--grey-400)', fontSize: '0.8125rem' }}>{ends ? `Ends ${ends}` : 'Ending'}</span>
  }

  const label = synthetic ? 'Cancel membership' : 'Cancel at period end'
  const confirmMsg = synthetic
    ? 'Cancel this membership now? This removes their member benefits immediately.'
    : `Schedule this membership to cancel at the end of the paid period${
        fmtDate(periodEnd) ? ` (${fmtDate(periodEnd)})` : ''
      }? Billing stops after that — no further charges.`

  const cancel = async () => {
    if (!window.confirm(confirmMsg)) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/cancel-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membership_id: id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
      <button
        type="button"
        className="btn"
        disabled={busy}
        onClick={cancel}
        style={{ border: '1px solid var(--grey-300, #cbd5e1)', color: 'var(--grey-500, #475569)', background: 'transparent', height: '2rem', padding: '0 0.75rem', fontSize: '0.8125rem' }}
      >
        {busy ? 'Working…' : label}
      </button>
      {error && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{error}</span>}
    </div>
  )
}
