'use client'

import { useState, useEffect } from 'react'
import { getEvent, type FestivalEvent } from '@/lib/events'
import { CampNearPicker, type Picked } from '@/components/CampNearPicker'
import { isInstalmentAvailable, calculateInstalmentSchedule, INSTALMENT_CUTOFF } from '@/lib/instalments'
import { formatAmount } from '@/lib/types'
import {
  FESTIVAL_CATEGORIES, EMPTY_TICKETS, categorySubtotal, festivalTotal, totalAttendees,
  type FestivalTickets, type FestivalCategoryKey, type FestivalFees,
} from '@/lib/pricing'

type Step = 'welcome' | 'form' | 'success'
type Accommodation = 'Tent' | 'Caravan' | 'Mobile Home' | 'Campervan'

interface FormData {
  first_name: string
  surname: string
  email: string
  mobile: string
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

// Quantity options for the ticket dropdowns.
const QTY_OPTIONS = Array.from({ length: 16 }, (_, i) => i)

// Resize a list of choices to `len`, keeping existing entries and padding with ''.
const resizeChoices = (prev: string[], len: number): string[] => {
  if (prev.length === len) return prev
  const next = prev.slice(0, len)
  while (next.length < len) next.push('')
  return next
}

export interface RegisterPricing {
  festival: FestivalFees
  foodOptions: string[]
}

export function RegisterForm({
  event = getEvent(undefined),
  pricing,
}: {
  event?: FestivalEvent
  pricing: RegisterPricing
}) {
  const [step, setStep]           = useState<Step>('welcome')
  const [agreed, setAgreed]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')
  // Honeypot — real users never see or fill this; bots that auto-fill every
  // field will populate it, letting the server reject them silently.
  const [hp, setHp]               = useState('')

  const [form, setForm] = useState<FormData>({
    first_name: '', surname: '', email: '', mobile: '',
    accommodation: '', electric_hookup: false, vehicle_reg: '', notes: '',
  })

  const [tickets, setTickets]         = useState<FestivalTickets>(EMPTY_TICKETS)
  // One food choice per attendee — adults first, then children. Arrays resize to
  // match the ticket counts (see the effects below).
  const [adultFood, setAdultFood]     = useState<string[]>([])
  const [kidFood, setKidFood]         = useState<string[]>([])
  const [campNear, setCampNear]       = useState<Picked[]>([])
  const [partnerEmail, setPartnerEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'full' | 'instalments'>('full')

  const showInstalments = isInstalmentAvailable(new Date())
  const previewSchedule = showInstalments
    ? calculateInstalmentSchedule(new Date(), 0)  // amounts unknown; preview dates only
    : []

  const patch = (key: keyof FormData, value: FormData[keyof FormData]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const setTicket = (key: FestivalCategoryKey, kind: 'adults' | 'kids', value: number) =>
    setTickets(prev => ({ ...prev, [key]: { ...prev[key], [kind]: value } }))

  const needsElectric = ELECTRIC_TYPES.includes(form.accommodation as Accommodation)
  const totals = totalAttendees(tickets)
  const peopleCount = totals.adults + totals.kids
  const grandTotal = festivalTotal(tickets, pricing.festival)

  // Keep the per-person food lists in step with the chosen ticket counts.
  useEffect(() => { setAdultFood(prev => resizeChoices(prev, totals.adults)) }, [totals.adults])
  useEffect(() => { setKidFood(prev => resizeChoices(prev, totals.kids)) }, [totals.kids])

  const setAdultChoice = (i: number, v: string) =>
    setAdultFood(prev => prev.map((c, idx) => (idx === i ? v : c)))
  const setKidChoice = (i: number, v: string) =>
    setKidFood(prev => prev.map((c, idx) => (idx === i ? v : c)))

  const validate = (): string => {
    if (!form.first_name.trim()) return 'Please enter your first name.'
    if (!form.surname.trim())    return 'Please enter your surname.'
    if (!form.email.trim())      return 'Please enter your email address.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Please enter a valid email address.'
    if (!form.mobile.trim())     return 'Please enter a mobile number.'
    if (peopleCount < 1)         return 'Please add at least one person to your booking.'
    if (!form.accommodation)     return 'Please select an accommodation type.'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError('')
    setSubmitting(true)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          adults: totals.adults,
          kids: totals.kids,
          tickets,
          food_preferences: [
            ...adultFood.map(choice => ({ kind: 'adult', choice })),
            ...kidFood.map(choice => ({ kind: 'child', choice })),
          ],
          company: hp,
          year: event.year,
          camp_near: campNear.map(p => p.id),
          partner_email: partnerEmail.trim() || undefined,
          payment_method: paymentMethod,
        }),
        signal: controller.signal,
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Registration failed — please try again.')
      setStep('success')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('The request timed out — please check your connection and try again.')
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong — please try again.')
      }
    } finally {
      clearTimeout(timeout)
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
          We&apos;ll be in touch to confirm your pitch details and payment plan.
        </p>
        <p className="reg-success-hint">
          A confirmation has been sent to <strong>{form.email}</strong>.
          Once your payment plan is ready you can view and pay through your booking portal.
        </p>
        <a href="/login?next=/my-booking" className="btn btn-accent" style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center' }}>
          View your booking
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
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

          <p className="reg-tc-hint">Please read these terms in full &mdash; scroll to the bottom to continue.</p>

          <div className="reg-tc-body">
            <p className="reg-tc-lead"><strong>SHARK FEST 2026 TERMS &amp; CONDITIONS PLEASE READ</strong></p>

            <p>These terms and conditions are designed to protect you &amp; other visitors to the Shark Fest 2026 Private Festival and the organizers and committee of the &ldquo;Shark Fest 2026&rdquo; Private Festival.</p>

            <p>Attendance at Shark Fest 2026 SHALL CONSTITUTE AN ACCEPTANCE BY THE Attendee and any family members/associates within their party OF THE TERMS, CONDITIONS AND ADVICE DETAILED BELOW AND IMPLIES AN UNDERTAKING ON THE PART OF THE HOLDER TO ACCEPT THEM.</p>

            <p>1) All conditions of attendance at Shark Fest 2026 are to be read together with all other statements and directives either shown here or displayed at the festival site.</p>

            <p>2) In the event of a breach of this contract by the Shark Fest 2026 Committee, the Shark Fest 2026 Committee shall not be liable for any loss, damage, cost or expense arising out of the breach, which was not reasonably foreseeable by the Shark Fest 2026 Committee at the date of this contract.</p>

            <p>3) The Shark Fest 2026 Committee reserves the right to refuse admission to any Attendee if in the reasonable opinion of the Shark Fest 2026 Committee admission of the Attendee to the festival site might be a risk to the safety of the other Shark Fest 2026 Attendees and/or the Attendee and/or affect the enjoyment of the other Shark Fest 2026 Attendees and/or the running of Shark Fest 2026, for example, if the Attendee appears to be under the influence of drink and/or drugs and/or is acting aggressively. No illegal substances will be permitted into Shark Fest 2026 festival site (the designated area of Broadleigh Park Farm Campsite); Attendees entering the Shark Fest 2026 festival site may be searched as a condition of the Shark Fest 2026 premises license.</p>

            <p>4) Camping is allowed at the festival site in the designated camping areas only. Any tents pitched or caravans or camper vans parked outside the designated areas or in the car parks will be removed by the owners of Broadleigh Park Farm Campsite.</p>

            <p>5) Any sleeping in vehicles other than those designated as proper camping vehicles (Campervans/Caravan/Tent/Trailer Tents) at Shark Fest 2026 is done entirely at the Attendees&rsquo; own risk.</p>

            <p>6) All Adult Attendees will receive a wristband on arrival Shark Fest 2026 these must be worn at all times for the duration of Shark Fest.</p>

            <p>7) All private sound systems and music are subject to noise abatement rules and must be switched off after 11pm. (Note the main Marquee music will be subject to the same rules by order of Broadleigh Park Farm Campsite.)</p>

            <p>8) Please use the recycling bins provided, we will be operating a &ldquo;Green&rdquo; Festival so we will recycle as much as possible &ndash; please help us to do this. Any Landfill Rubbish should be bagged up and disposed of in the Rubbish Dumpsters provided.</p>

            <p>9) No Campfires or Fire pits are permitted in any area of the Shark Fest 2026 festival site at any time.</p>

            <p>10) BBQs are permitted but MUST be off ground and must not be used inside or near tents by order of Broadleigh Park Farm, Campsite.</p>

            <p>11) There are disabled facilities in both the Rally Field and on the main site at Broadleigh Park Farm Campsite.</p>

            <p>12) No animals will be admitted to Shark Fest 2026, except assistance dogs or hearing dogs.</p>

            <p>13) Children under 18 years old must be accompanied by a Parent or responsible adult of age 18 or older at all times in the Shower/Toilet Blocks.</p>

            <p>14) Certain areas of Broadleigh Park Farm Campsite are strictly off Limits particularly the Barn areas which house farming machinery and live-stock which could be deemed as dangerous to Children &ndash; Parents ensure please you keep children away from those areas.</p>

            <p>15) The Speed Limit Speed at Shark Fest 2026 is strictly 5mph &ndash; please take care when driving on the site there will be children at play.</p>

            <p>16) Cars must be parked in front of Tents or Caravans &ndash; not alongside them.</p>

            <p>17) All designated camping pitches at Shark Fest 2026 will be 5m wide &ndash; there must be at least a 5m gap between Tents/Caravans adjoining each other.</p>

            <p>18) Behavior at Shark Fest 2026 &ndash; this is a predominantly family event &ndash; there will be lots of impressionable children attending &ndash; any anti-social/lewd or aggressive behavior will not be tolerated at any time &ndash; offenders will be told to leave Shark Fest 2026 and will be subject to a banning order from all future events.</p>

            <p>19) Staff &amp; Artistes at Shark Fest 2026 should be treated with respect at all times they are there to help make your experience a good one &ndash; any abuse or threatening behavior towards them will be dealt with in the same way as specified in point (18)</p>

            <p>20) If you look under 25 please do not be offended if we ask you for proof of age when you visit the bar. Please bring proof of ID to show you are over 18.</p>

            <p>21) Strictly no trading is allowed inside the Shark Fest 2026 festival site without Prior agreement from the Shark Fest 2026 committee.</p>

            <p>22) Fireworks &amp; Laser pens are prohibited at Shark Fest 2026</p>

            <p>23) Privacy is important to Shark Fest 2026 please do not post anything on social media or Promote Shark Fest 2026 till after the event &ndash; we do not want gate-crashers &ndash; Note: No unauthorized Drones are allowed at Shark Fest 2026</p>

            <p>24) Whilst every effort is made to ensure the full, advertised bill performs on stage, it should be understood that Shark Fest 2026 is a full event with numerous other activities. Shark Fest 2026 reserves the right to change the bill or running time without prior notice.</p>

            <p>25) In the event of cancellation of the festival by The Shark Fest 2026 refunds will be limited to monies not allocated to suppliers and or 3rd parties at that point.</p>

            <p>26) Shark Fest 2026 is A Strictly Private Event and as such strictly controlled - If you cannot attend Shark Fest 2026 under no circumstances should you &ldquo;Sell&rdquo; on your place &ndash; without the express permission of the Shark Fest 2026 Committee. You should notify the organisers as soon as possible and your place will be allocated to the waiting list.</p>

            <p>27) Wristband holders&rsquo; consent to the photography, filming/sound recording of the event as members of the audience, which may be used for an official video produced for Shark Fest 2026.</p>

            <p>28) As a non-for-profit event we must make payments for services up front &ndash; therefore any payments from Attendees at Shark Fest 2026 are not refundable or transferable unless by prior arrangement.</p>

            <p>29) Please note there are restricted capacities within all tented structures, once they reach their maximum capacities there will be no further admissions. You are not guaranteed admission to these areas.</p>

            <p>30) It is against the law to smoke in enclosed spaces, Strictly NO SMOKING in the Marquee at any time.</p>

            <p>31) Shark Fest 2026 is predominantly an outdoor event. We advise you to bring appropriate clothing and footwear to protect against potentially inclement weather.</p>

            <p>32) Shark Fest 2026 reserves the right to implement any restrictions deemed necessary before and during the event to ensure the safe management of the festival site.</p>

            <p>33) Shark Fest 2026 reserves the right to amend the terms and conditions of the Event in accordance with any new laws, legislation or internal policies.</p>

            <p>34) All tents/caravans MUST be removed from Broadleigh Park Farm by 09:00 on Tuesday 26th May 2026. Broadleigh Park Farm reserves the right to remove any remaining tents/caravans after this point.</p>

            <p>35) No more than 1 splitter unit may be used for each Electric Hook-up point &ndash; to prevent overloading.</p>

            <p className="reg-tc-warning"><strong>WARNING: IT IS POSSIBLE THAT EXPOSURE TO LOUD MUSIC MAY CAUSE DAMAGE TO HEARING.</strong></p>
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

        {/* Tickets — choose adults/kids per ticket type */}
        <div className="cu-field">
          <p className="cu-label">Your tickets *</p>
          <p className="reg-field-hint" style={{ marginTop: 0 }}>
            Choose how many adults and children (4–17) for each ticket type. Your estimated total updates below.
          </p>
          <div className="reg-tickets">
            {FESTIVAL_CATEGORIES.map(cat => {
              const subtotal = categorySubtotal(cat, tickets, pricing.festival)
              return (
                <div key={cat.key} className="reg-ticket-row">
                  <div className="reg-ticket-info">
                    <span className="reg-ticket-name">{cat.label}</span>
                    <span className="reg-ticket-hint">
                      {cat.hint} · Adult {formatAmount(pricing.festival[cat.adultKey])}
                      {cat.kidsFree ? ' · Kids free' : ` · Kid ${formatAmount(pricing.festival[cat.kidKey])}`}
                    </span>
                  </div>
                  <div className="reg-ticket-qtys">
                    <label className="reg-qty">
                      <span className="reg-qty-label">Adults</span>
                      <select className="cu-input reg-qty-select" value={tickets[cat.key].adults}
                        onChange={e => setTicket(cat.key, 'adults', Number(e.target.value))}>
                        {QTY_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </label>
                    <label className="reg-qty">
                      <span className="reg-qty-label">Children</span>
                      <select className="cu-input reg-qty-select" value={tickets[cat.key].kids}
                        onChange={e => setTicket(cat.key, 'kids', Number(e.target.value))}>
                        {QTY_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </label>
                    <span className="reg-ticket-sub">{subtotal > 0 ? formatAmount(subtotal) : '—'}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="reg-total-row">
            <div>
              <span className="reg-total-label">Estimated total</span>
              <span className="reg-total-people">{peopleCount} {peopleCount === 1 ? 'person' : 'people'}</span>
            </div>
            <span className="reg-total-amount">{formatAmount(grandTotal)}</span>
          </div>
          <p className="reg-field-hint">
            This is an estimate from the current SharkFest fees. The committee will confirm your final price.
          </p>
        </div>

        {/* Food preferences — one per person */}
        {peopleCount > 0 && (
          <div className="cu-field">
            <p className="cu-label">Food preferences <span className="cu-optional">(optional)</span></p>
            <p className="reg-field-hint" style={{ marginTop: 0 }}>
              Pick the closest option for each person — it helps us cater.
            </p>
            <div className="reg-food-list">
              {adultFood.map((choice, i) => (
                <label key={`a${i}`} className="reg-food-row">
                  <span className="reg-food-who">Adult {i + 1}</span>
                  <select className="cu-input reg-food-select" value={choice}
                    onChange={e => setAdultChoice(i, e.target.value)}>
                    <option value="">No preference</option>
                    {pricing.foodOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
              ))}
              {kidFood.map((choice, i) => (
                <label key={`k${i}`} className="reg-food-row">
                  <span className="reg-food-who">Child {i + 1}</span>
                  <select className="cu-input reg-food-select" value={choice}
                    onChange={e => setKidChoice(i, e.target.value)}>
                    <option value="">No preference</option>
                    {pricing.foodOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </div>
        )}

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
          <p className="cu-label">Who would you like to be near? <span className="cu-optional">(optional)</span></p>
          <CampNearPicker year={event.year} eventName={event.name} picked={campNear} onChange={setCampNear} max={1} />
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
