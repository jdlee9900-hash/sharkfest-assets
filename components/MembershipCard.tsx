import Image from 'next/image'

interface Props {
  name: string
  membershipNumber: string
  plan: 'monthly' | 'annual'
  status: string
  memberSince: string | null
  qrDataUrl: string | null
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

// A premium, credit-card-style digital membership pass. Presentational only.
export function MembershipCard({ name, membershipNumber, plan, status, memberSince, qrDataUrl }: Props) {
  const tier = plan === 'annual' ? 'Annual Member' : 'Member'
  const live = status === 'active' || status === 'past_due'

  return (
    <div className="mcard" role="img" aria-label={`Digital membership card for ${name}, ${tier}, number ${membershipNumber}`}>
      <div className="mcard-sheen" aria-hidden="true" />
      <div className="mcard-top">
        <div className="mcard-brand">
          <Image src="/logo.png" alt="" width={40} height={40} className="mcard-crest" />
          <div>
            <p className="mcard-club">Torbay Sharks RFC</p>
            <p className="mcard-kind">SharkFest Membership</p>
          </div>
        </div>
        <span className={`mcard-status ${live ? 'is-live' : 'is-off'}`}>
          {live ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="mcard-body">
        <div className="mcard-fields">
          <p className="mcard-label">Member</p>
          <p className="mcard-name">{name}</p>
          <div className="mcard-meta">
            <div>
              <p className="mcard-label">Membership No.</p>
              <p className="mcard-value">{membershipNumber}</p>
            </div>
            <div>
              <p className="mcard-label">Tier</p>
              <p className="mcard-value">{tier}</p>
            </div>
            <div>
              <p className="mcard-label">Member since</p>
              <p className="mcard-value">{fmtDate(memberSince)}</p>
            </div>
          </div>
        </div>
        {qrDataUrl && (
          <div className="mcard-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Membership verification QR code" width={92} height={92} />
          </div>
        )}
      </div>

      <p className="mcard-foot">SHARKFEST · TORBAY · 2027</p>
    </div>
  )
}
