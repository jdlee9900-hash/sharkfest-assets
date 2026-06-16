'use client'

import { useState } from 'react'
import {
  FESTIVAL_CATEGORIES, type SitePricing, type FestivalFees, type MembershipPrices,
} from '@/lib/pricing'

const MEMBERSHIP_FIELDS: { key: keyof MembershipPrices; label: string }[] = [
  { key: 'playing',       label: 'Playing Sharks Member (incl. family/partner)' },
  { key: 'social_family', label: 'Non-Playing Social Family' },
  { key: 'social_single', label: 'Non-Playing Single Social' },
]

const toPounds = (pence: number) => (pence / 100).toFixed(2)
const toPence  = (pounds: string) => Math.max(0, Math.round((parseFloat(pounds) || 0) * 100))

// A money input that edits a pence value as pounds.
function MoneyField({ label, value, onChange, perMonth }: {
  label: string; value: number; onChange: (pence: number) => void; perMonth?: boolean
}) {
  return (
    <div className="cu-field">
      <label className="cu-label">{label}</label>
      <div className="adm-amount-wrap">
        <span className="adm-amount-prefix">£</span>
        <input
          type="number" min="0" step="0.01" className="cu-input adm-amount-input"
          value={toPounds(value)}
          onChange={e => onChange(toPence(e.target.value))}
        />
        {perMonth && <span className="adm-price-suffix">/mo</span>}
      </div>
    </div>
  )
}

export function AdminPricing({ initial }: { initial: SitePricing }) {
  const [membership, setMembership] = useState<MembershipPrices>(initial.membership)
  const [festival, setFestival]     = useState<FestivalFees>(initial.festival)
  const [foodText, setFoodText]     = useState(initial.foodOptions.join(', '))
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [error, setError]           = useState('')

  const setMember = (key: keyof MembershipPrices, pence: number) =>
    { setMembership(m => ({ ...m, [key]: pence })); setSaved(false) }
  const setFee = (key: keyof FestivalFees, pence: number) =>
    { setFestival(f => ({ ...f, [key]: pence })); setSaved(false) }

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false)
    try {
      const foodOptions = foodText.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membership, festival, foodOptions }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Could not save pricing')
      setMembership(body.membership)
      setFestival(body.festival)
      setFoodText((body.foodOptions ?? []).join(', '))
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {error && (
        <div className="auth-error" role="alert">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {/* Membership */}
      <section className="mb-card">
        <h2 className="mb-card-title">Membership — monthly price</h2>
        <p className="mb-camp-intro" style={{ marginBottom: '1rem' }}>
          These prices show on the Join page. The amount actually charged is set by the matching
          Stripe recurring price — keep the two in sync.
        </p>
        <div className="adm-price-grid">
          {MEMBERSHIP_FIELDS.map(f => (
            <MoneyField key={f.key} label={f.label} value={membership[f.key]} perMonth
              onChange={pence => setMember(f.key, pence)} />
          ))}
        </div>
      </section>

      {/* SharkFest fees */}
      <section className="mb-card">
        <h2 className="mb-card-title">SharkFest fees — per head</h2>
        <p className="mb-camp-intro" style={{ marginBottom: '1rem' }}>
          Used to calculate the estimated total in the booking form.
        </p>
        {FESTIVAL_CATEGORIES.map(cat => (
          <div key={cat.key} className="adm-fee-group">
            <p className="adm-fee-title">{cat.label} <span className="adm-fee-hint">{cat.hint}</span></p>
            <div className="adm-price-grid">
              <MoneyField label="Adult" value={festival[cat.adultKey]} onChange={pence => setFee(cat.adultKey, pence)} />
              <MoneyField label={cat.kidsFree ? 'Kid (usually free)' : 'Kid (4–17)'} value={festival[cat.kidKey]} onChange={pence => setFee(cat.kidKey, pence)} />
            </div>
          </div>
        ))}
      </section>

      {/* Food preferences */}
      <section className="mb-card">
        <h2 className="mb-card-title">Food preference options</h2>
        <p className="mb-camp-intro" style={{ marginBottom: '0.75rem' }}>
          Comma-separated. Shown as a drop-down in the booking form (e.g. Meat Eater, Vegetarian, Gluten Free).
        </p>
        <input className="cu-input" value={foodText} onChange={e => { setFoodText(e.target.value); setSaved(false) }}
          placeholder="Meat Eater, Vegetarian, Gluten Free" />
      </section>

      <div className="mb-camp-actions">
        <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save pricing'}
        </button>
        {saved && (
          <span className="mb-camp-saved">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            Saved
          </span>
        )}
      </div>
    </>
  )
}
