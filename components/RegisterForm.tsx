'use client'

import { useState } from 'react'
import { getEvent, type FestivalEvent } from '@/lib/events'
import { CampNearPicker, type Picked } from '@/components/CampNearPicker'
import { isInstalmentAvailable, calculateInstalmentSchedule, INSTALMENT_CUTOFF } from '@/lib/instalments'

type Step = 'welcome' | 'form' | 'success'
type Accommodation = 'Tent' | 'Caravan' | 'Mobile Home' | 'Campervan'

interface FormData {
  first_name: string
  surname: string
  email: string
  mobile: string
  adults: number
  kids: number
  accommodation: Accommodation | ''
  electric_hookup: boolean
  vehicle_reg: string
  notes: string
}

const ACCOMMODATIONS: { value: Accommodation; label: string; icon: string; hint: string }[] = [
  { value: 'Tent',        label: 'Tent',        icon: '⛺', hint: 'Standard camping pitch' },
  { value: 'Caravan',     label: 'Caravan',     icon: '🚐', hint: 'Full caravan pitch' },
  { value: 'Mobile Home', label: 'Mobile Home', icon: '🏠', hint: 'Static mobile home' },
  { value: 'Campervan',   label: 'Campervan',   icon: '🚌', hint: 'Self-contained campervan' },
]

const ELECTRIC_TYPES: Accommodation[] = ['Caravan', 'Mobile Home', 'Campervan']

export function RegisterForm({ event = getEvent(undefined) }: { event?: FestivalEvent }) {
  const [step, setStep]           = useState<Step>('welcome')
  const [agreed, setAgreed]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')
  // Honeypot — real users never see or fill this; bots that auto-fill every
  // field will populate it, letting the server reject them silently.
  const [hp, setHp]               = useState('')

  const [form, setForm] = useState<FormData>({
    first_name: '', surname: '', email: '', mobile: '',
    adults: 1, kids: 0, accommodation: '',
    electric_hookup: false, vehicle_reg: '', notes: '',
  })

  const [campNear, setCampNear]       = useState<Picked[]>([])
  const [partnerEmail, setPartnerEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'full' | 'instalments'>('full')

  const showInstalments = isInstalmentAvailable(new Date())
  const previewSchedule = showInstalments
    ? calculateInstalmentSchedule(new Date(), 0)  // amounts unknown; preview dates only
    : []

  const patch = (key: keyof FormData, value: FormData[keyof FormData]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const needsElectric = ELECTRIC_TYPES.includes(form.accommodation as Accommodation)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.accommodation) { setError('Please select an accommodation type.'); return }
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, company: hp, year: event.year, camp_near: campNear.map(p => p.id), partner_email: partnerEmail.trim() || undefined, payment_method: paymentMethod }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Registration failed')
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="reg-card reg-card--success">
        <div className="reg-success-icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h2 className="reg-success-title">You&apos;re registered!</h2>
        <p className="reg-success-sub">
          Thanks for signing up for <strong>{event.name}</strong>.<br/>
          We&apos;ll be in touch with your pitch details and payment plan shortly.
        </p>
        <p className="reg-success-hint">
          A confirmation has been sent to <strong>{form.email}</strong>.
          Once your payment plan is ready, you can view and pay through your{' '}
          <a href="/login?next=/my-booking" className="reg-link">booking portal</a>.
        </p>
      </div>
    )
  }

  if (step === 'welcome') {
    return (
      <div className="reg-card">
        <div className="section-label" style={{ justifyContent: 'center', marginBottom: '0.75rem' }}>
          <span className="section-label-line" />
          {event.name}
          <span className="section-label-line" />
        </div>
        <h2 className="reg-card-title">Register for {event.name}</h2>
        <p className="reg-card-sub">
          {event.dates} · {event.location}
        </p>

        <div className="reg-tc">
          <h3 className="reg-tc-title">Terms &amp; Conditions</h3>

          <div className="reg-tc-body">
            <p><strong>Registration</strong><br/>
            Completing this form reserves your pitch at {event.name}, held at the Torbay Sharks RFC ground on the Devon Coast from {event.dates}. Your place is not confirmed until a deposit has been received.</p>

            <p><strong>Pricing &amp; Payment</strong><br/>
            Costs vary by pitch type, party size, and requirements. Our team will allocate your personal pricing and send a breakdown to your email within 7 days. Payment can be made in full or in agreed instalments through your booking portal.</p>

            <p><strong>Cancellations</strong><br/>
            Deposits are non-refundable. Cancellations made more than 60 days before the event may receive a partial refund of additional payments at the committee&apos;s discretion. Cancellations within 60 days forfeit all payments.</p>

            <p><strong>Site Rules</strong><br/>
            All attendees agree to respect the site, neighbouring pitches, and fellow festival-goers. A midnight noise curfew is in place each evening. Open fires must be in designated areas only. The organisers reserve the right to remove anyone who does not comply with site rules without refund.</p>

            <p><strong>Vehicles &amp; Children</strong><br/>
            All vehicles require a valid site pass. Please ensure your registration number is accurate. Children under 16 must be supervised by a responsible adult at all times.</p>

            <p><strong>Photography</strong><br/>
            Torbay Sharks RFC may photograph or film the event for promotional purposes. Attendance constitutes consent to inclusion in such media. Requests for removal should be directed to the club secretary.</p>
          </div>
        </div>

        <label className="reg-tc-agree">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
          />
          <span>I have read and agree to the Terms &amp; Conditions</span>
        </label>

        <button
          className="btn btn-accent reg-next-btn"
          onClick={() => setStep('form')}
          disabled={!agreed}
        >
          Continue to registration
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    )
  }

  return (
    <div className="reg-card">
      <div className="reg-steps" aria-label="Step 2 of 2">
        <span className="reg-step reg-step--done">T&amp;C</span>
        <span className="reg-step-line" />
        <span className="reg-step reg-step--active">Your details</span>
      </div>

      <h2 className="reg-card-title">Your details</h2>

      {error && (
        <div className="auth-error" role="alert">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="reg-form" noValidate>

        {/* Honeypot: hidden from users, attractive to bots. */}
        <input
          type="text"
          name="company"
          value={hp}
          onChange={e => setHp(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        />

        {/* Name */}
        <div className="reg-row">
          <div className="cu-field">
            <label htmlFor="reg-first" className="cu-label">First name *</label>
            <input id="reg-first" type="text" className="cu-input" required
              value={form.first_name} onChange={e => patch('first_name', e.target.value)}
              autoComplete="given-name" placeholder="Sarah" />
          </div>
          <div className="cu-field">
            <label htmlFor="reg-sur" className="cu-label">Surname *</label>
            <input id="reg-sur" type="text" className="cu-input" required
              value={form.surname} onChange={e => patch('surname', e.target.value)}
              autoComplete="family-name" placeholder="Jones" />
          </div>
        </div>

        {/* Contact */}
        <div className="reg-row">
          <div className="cu-field">
            <label htmlFor="reg-email" className="cu-label">Email address *</label>
            <input id="reg-email" type="email" className="cu-input" required
              value={form.email} onChange={e => patch('email', e.target.value)}
              autoComplete="email" placeholder="sarah@example.com" />
          </div>
          <div className="cu-field">
            <label htmlFor="reg-mobile" className="cu-label">Mobile number *</label>
            <input id="reg-mobile" type="tel" className="cu-input" required
              value={form.mobile} onChange={e => patch('mobile', e.target.value)}
              autoComplete="tel" placeholder="07700 900 123" />
          </div>
        </div>

        {/* Party size */}
        <div className="reg-row">
          <div className="cu-field">
            <label htmlFor="reg-adults" className="cu-label">Adults (18+) *</label>
            <input id="reg-adults" type="number" className="cu-input" required
              min={1} max={20} value={form.adults}
              onChange={e => patch('adults', parseInt(e.target.value) || 1)} />
          </div>
          <div className="cu-field">
            <label htmlFor="reg-kids" className="cu-label">Children (under 18)</label>
            <input id="reg-kids" type="number" className="cu-input"
              min={0} max={20} value={form.kids}
              onChange={e => patch('kids', parseInt(e.target.value) || 0)} />
          </div>
        </div>

        {/* Accommodation */}
        <div className="cu-field">
          <p className="cu-label">Accommodation type *</p>
          <div className="reg-accom-grid">
            {ACCOMMODATIONS.map(a => (
              <button
                key={a.value}
                type="button"
                className={`reg-accom-card ${form.accommodation === a.value ? 'reg-accom-card--active' : ''}`}
                onClick={() => {
                  patch('accommodation', a.value)
                  if (!ELECTRIC_TYPES.includes(a.value)) patch('electric_hookup', false)
                }}
              >
                <span className="reg-accom-icon" aria-hidden="true">{a.icon}</span>
                <span className="reg-accom-label">{a.label}</span>
                <span className="reg-accom-hint">{a.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Electric hookup */}
        {needsElectric && (
          <label className="reg-tc-agree">
            <input
              type="checkbox"
              checked={form.electric_hookup}
              onChange={e => patch('electric_hookup', e.target.checked)}
            />
            <span>Electric hookup required</span>
          </label>
        )}

        {/* Camp near */}
        <div className="cu-field">
          <p className="cu-label">Who would you like to camp near? <span className="cu-optional">(optional)</span></p>
          <CampNearPicker year={event.year} eventName={event.name} picked={campNear} onChange={setCampNear} />
        </div>

        {/* Partner email */}
        <div className="cu-field">
          <label htmlFor="reg-partner" className="cu-label">Partner / shared-access email <span className="cu-optional">(optional)</span></label>
          <input id="reg-partner" type="email" className="cu-input"
            value={partnerEmail} onChange={e => setPartnerEmail(e.target.value)}
            autoComplete="off" placeholder="partner@example.com" />
          <span className="reg-field-hint">Add a second email to share this booking. They'll receive an invite link and can view payments and manage camp preferences.</span>
        </div>

        {/* Vehicle reg */}
        <div className="cu-field">
          <label htmlFor="reg-vreg" className="cu-label">Vehicle registration plate</label>
          <input id="reg-vreg" type="text" className="cu-input"
            value={form.vehicle_reg} onChange={e => patch('vehicle_reg', e.target.value)}
            placeholder="AB12 CDE" style={{ textTransform: 'uppercase' }} />
          <span className="reg-field-hint">Required for site access. Leave blank if not bringing a vehicle.</span>
        </div>

        {/* Notes */}
        <div className="cu-field">
          <label htmlFor="reg-notes" className="cu-label">Additional notes</label>
          <textarea id="reg-notes" className="cu-input reg-textarea"
            value={form.notes} onChange={e => patch('notes', e.target.value)}
            placeholder="Anything else we should know — accessibility requirements, preferred location, etc."
            rows={3} />
        </div>

        {/* Payment method */}
        <div className="cu-field">
          <p className="cu-label">Payment method</p>
          <div className="reg-pay-grid">
            <button
              type="button"
              className={`reg-pay-option ${paymentMethod === 'full' ? 'reg-pay-option--active' : ''}`}
              onClick={() => setPaymentMethod('full')}
            >
              <span className="reg-pay-icon" aria-hidden="true">💳</span>
              <span className="reg-pay-label">Deposit + balance</span>
              <span className="reg-pay-hint">£50 deposit to secure your place, then pay the rest whenever you're ready.</span>
            </button>

            {showInstalments ? (
              <button
                type="button"
                className={`reg-pay-option ${paymentMethod === 'instalments' ? 'reg-pay-option--active' : ''}`}
                onClick={() => setPaymentMethod('instalments')}
              >
                <span className="reg-pay-icon" aria-hidden="true">📅</span>
                <span className="reg-pay-label">3 equal instalments</span>
                <span className="reg-pay-hint">
                  Split into 3 equal payments, due approximately:
                  {previewSchedule.map(s => (
                    <span key={s.dueDateIso} className="reg-pay-date">
                      {s.dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  ))}
                  Amounts confirmed once your booking is reviewed.
                </span>
              </button>
            ) : (
              <div className="reg-pay-option reg-pay-option--disabled">
                <span className="reg-pay-icon" aria-hidden="true">📅</span>
                <span className="reg-pay-label">3 equal instalments</span>
                <span className="reg-pay-hint">
                  No longer available — bookings within 4 months of the event require full payment.
                  Cut-off was {INSTALMENT_CUTOFF.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="reg-actions">
          <button type="button" className="reg-back-btn" onClick={() => setStep('welcome')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </button>
          <button type="submit" className="btn btn-accent reg-next-btn" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Complete registration'}
          </button>
        </div>
      </form>
    </div>
  )
}
