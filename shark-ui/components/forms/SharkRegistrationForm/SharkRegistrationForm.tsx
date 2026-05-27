'use client'

import { useState } from 'react'
import { SharkFormStep } from '../SharkFormStep/SharkFormStep'
import { SharkInput } from '../../primitives/SharkInput/SharkInput'
import { SharkCard } from '../../primitives/SharkCard/SharkCard'
import { cn } from '@/utils'

interface FormData {
  // Step 1: Lead
  firstName: string
  lastName: string
  email: string
  mobile: string
  dietary: string
  // Step 2: Group
  groupMembers: Array<{ name: string; dietary: string }>
  // Step 3: Camping
  campingArea: 'A' | 'B' | 'C' | ''
  hookup: boolean
  vehicleType: string
  // Step 4: Requirements
  requirements: string
}

const steps = [
  { label: 'Lead attendee',        description: 'Your personal details and contact info.' },
  { label: 'Group members',        description: 'Add anyone camping with you.' },
  { label: 'Camping preferences',  description: 'Choose your area and hook-up needs.' },
  { label: 'Special requirements', description: 'Anything we should know?' },
  { label: 'Review & submit',      description: 'Check your details before submitting.' },
]

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>
}

function Select({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: string[] }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#0f172a] mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full font-body text-sm text-[#0f172a] bg-white rounded-[8px] border border-[#e2e8f0] py-2.5 px-3 hover:border-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[rgba(251,191,36,0.4)] focus:border-[#fbbf24] transition-colors"
      >
        {options.map(o => <option key={o} value={o}>{o || '— Select —'}</option>)}
      </select>
    </div>
  )
}

export interface SharkRegistrationFormProps {
  onSubmit?: (data: FormData) => void
  className?: string
}

export function SharkRegistrationForm({ onSubmit, className }: SharkRegistrationFormProps) {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [data, setData] = useState<FormData>({
    firstName: '', lastName: '', email: '', mobile: '', dietary: '',
    groupMembers: [],
    campingArea: '', hookup: false, vehicleType: '',
    requirements: '',
  })

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData(d => ({ ...d, [key]: value }))
  }

  function handleSubmit() {
    onSubmit?.(data)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <SharkCard variant="default" className={cn('text-center py-12', className)}>
        <div className="w-12 h-12 rounded-full bg-[#dcfce7] flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none"><path d="M1.5 8l6 6L20.5 1" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h2 className="font-display text-3xl text-[#0f172a] mb-2">You&apos;re registered</h2>
        <p className="text-sm text-[#64748b]">
          Confirmation sent to <strong className="text-[#0f172a]">{data.email}</strong>.
        </p>
        <p className="mt-2 text-sm text-[#94a3b8]">See you at SharkFest 2028.</p>
      </SharkCard>
    )
  }

  const stepContent = [
    // Step 1
    <FieldRow key="step1">
      <div className="grid grid-cols-2 gap-3">
        <SharkInput label="First name" placeholder="Jo" value={data.firstName} onChange={e => update('firstName', e.target.value)} />
        <SharkInput label="Last name" placeholder="Bloggs" value={data.lastName} onChange={e => update('lastName', e.target.value)} />
      </div>
      <SharkInput label="Email" placeholder="jo@example.com" type="email" value={data.email} onChange={e => update('email', e.target.value)} />
      <SharkInput label="Mobile" placeholder="+44 7700 900000" type="tel" value={data.mobile} onChange={e => update('mobile', e.target.value)} />
      <Select label="Dietary requirements" value={data.dietary} onChange={v => update('dietary', v)} options={['', 'None', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Other']} />
    </FieldRow>,

    // Step 2
    <FieldRow key="step2">
      <p className="text-sm text-[#64748b]">Add names of others in your pitch. Leave blank if you&apos;re camping solo.</p>
      {data.groupMembers.map((m, i) => (
        <div key={i} className="flex gap-2 items-start">
          <SharkInput
            label={`Member ${i + 1}`}
            placeholder="Full name"
            value={m.name}
            onChange={e => {
              const next = [...data.groupMembers]
              next[i] = { ...next[i], name: e.target.value }
              update('groupMembers', next)
            }}
          />
          <button
            type="button"
            onClick={() => update('groupMembers', data.groupMembers.filter((_, j) => j !== i))}
            className="mt-6 text-[#94a3b8] hover:text-[#ef4444] transition-colors text-sm"
            aria-label="Remove member"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => update('groupMembers', [...data.groupMembers, { name: '', dietary: '' }])}
        className="text-sm text-[#0f172a] font-medium underline underline-offset-4 hover:text-[#334155] transition-colors"
      >
        + Add group member
      </button>
    </FieldRow>,

    // Step 3
    <FieldRow key="step3">
      <div>
        <label className="block text-sm font-semibold text-[#0f172a] mb-2">Camping area</label>
        <div className="grid grid-cols-3 gap-2">
          {(['A', 'B', 'C'] as const).map(area => (
            <button
              key={area}
              type="button"
              onClick={() => update('campingArea', area)}
              className={cn(
                'py-3 rounded-[10px] border text-sm font-medium transition-all',
                data.campingArea === area
                  ? 'bg-[#0f172a] text-white border-[#0f172a]'
                  : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-[#94a3b8]',
              )}
            >
              Area {area}
            </button>
          ))}
        </div>
      </div>
      <Select label="Vehicle type" value={data.vehicleType} onChange={v => update('vehicleType', v)} options={['', 'Tent only', 'Caravan', 'Motorhome', 'Campervan']} />
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={data.hookup} onChange={e => update('hookup', e.target.checked)} className="w-4 h-4 rounded accent-[#fbbf24]" />
        <span className="text-sm font-body text-[#0f172a]">I need an electric hook-up</span>
      </label>
    </FieldRow>,

    // Step 4
    <FieldRow key="step4">
      <div>
        <label className="block text-sm font-semibold text-[#0f172a] mb-1.5">Special requirements</label>
        <textarea
          value={data.requirements}
          onChange={e => update('requirements', e.target.value)}
          placeholder="Accessibility needs, medical notes, etc. We read every entry."
          rows={5}
          className="w-full font-body text-sm text-[#0f172a] bg-white rounded-[8px] border border-[#e2e8f0] py-2.5 px-3 hover:border-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[rgba(251,191,36,0.4)] focus:border-[#fbbf24] resize-none transition-colors"
        />
      </div>
    </FieldRow>,

    // Step 5 — Review
    <FieldRow key="step5">
      <SharkCard variant="outline" padding="md">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {[
            ['Name', `${data.firstName} ${data.lastName}`.trim() || '—'],
            ['Email', data.email || '—'],
            ['Mobile', data.mobile || '—'],
            ['Dietary', data.dietary || 'None'],
            ['Group size', String(data.groupMembers.length)],
            ['Area', data.campingArea || '—'],
            ['Vehicle', data.vehicleType || '—'],
            ['Hook-up', data.hookup ? 'Yes' : 'No'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[#94a3b8] font-medium">{k}</dt>
              <dd className="text-[#0f172a] font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </SharkCard>
      <p className="text-xs text-[#94a3b8]">
        By submitting you agree to our terms and conditions. You will receive a confirmation by email.
      </p>
    </FieldRow>,
  ]

  return (
    <div className={className}>
      <SharkFormStep
        steps={steps}
        currentStep={step}
        onNext={() => setStep(s => Math.min(steps.length - 1, s + 1))}
        onBack={() => setStep(s => Math.max(0, s - 1))}
        onSubmit={handleSubmit}
      >
        {stepContent[step]}
      </SharkFormStep>
    </div>
  )
}
