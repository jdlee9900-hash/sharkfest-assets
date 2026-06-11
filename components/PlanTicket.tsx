import type { ReactNode } from 'react'
import { formatAmount, type MemberPlan } from '@/lib/types'

interface Tier {
  id: MemberPlan
  label: string
  tagline: string
  perks: string[]
  free?: boolean
}

interface PlanTicketProps {
  tier: Tier
  amount: number | null
  highlighted?: boolean
  savePercent?: number | null
  /** CTA slot — a <Link> from the server page, a <button> from MembershipPlans. */
  children: ReactNode
}

// A festival-pass style plan card: navy stub, perforated tear line, white body.
// Purely presentational so it renders on the server and inside client pickers.
export function PlanTicket({ tier, amount, highlighted = false, savePercent = null, children }: PlanTicketProps) {
  return (
    <div className={`tix${highlighted ? ' tix--highlight' : ''}`}>
      {savePercent != null && savePercent > 0 && (
        <span className="tix-save" aria-hidden="true">Save {savePercent}%</span>
      )}
      {highlighted && <span className="tix-picked">Your pick</span>}
      <div className="tix-stub">
        <div>
          <p className="tix-kind">SharkFest · Member Pass</p>
          <p className="tix-name">{tier.label}</p>
        </div>
        <span className="tix-barcode" aria-hidden="true" />
      </div>
      <div className="tix-perf" aria-hidden="true" />
      <div className="tix-body">
        <p className="tix-price">
          {amount != null
            ? <><span className="tix-amount">{formatAmount(amount)}</span><span className="tix-per">/month</span></>
            : <span className="tix-amount">—</span>}
        </p>
        <p className="tix-tagline">{tier.tagline}</p>
        <ul className="tix-perks">
          {tier.perks.map(p => <li key={p}>{p}</li>)}
        </ul>
        {children}
      </div>
    </div>
  )
}

interface CommunityTicketProps {
  tier: Tier
  highlighted?: boolean
  children: ReactNode
}

// The free tier as an understated grey "fan club" stub — visually subordinate
// to the paid passes, no foil, no price block.
export function CommunityTicket({ tier, highlighted = false, children }: CommunityTicketProps) {
  return (
    <div className={`tix tix--community${highlighted ? ' tix--highlight' : ''}`}>
      {highlighted && <span className="tix-picked">Your pick</span>}
      <div className="tix-stub tix-stub--community">
        <div>
          <p className="tix-kind tix-kind--community">SharkFest · Fan Club</p>
          <p className="tix-name tix-name--community">{tier.label}</p>
        </div>
        <span className="tix-free">Free</span>
      </div>
      <div className="tix-perf" aria-hidden="true" />
      <div className="tix-body">
        <p className="tix-tagline">{tier.tagline}</p>
        <ul className="tix-perks">
          {tier.perks.map(p => <li key={p}>{p}</li>)}
        </ul>
        <p className="tix-note">Does not include the SharkFest festival discount — upgrade any time.</p>
        {children}
      </div>
    </div>
  )
}
