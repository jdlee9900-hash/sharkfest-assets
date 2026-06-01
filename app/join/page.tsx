import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership, memberPriceId, memberDiscountPercent } from '@/lib/membership'
import { LoginForm } from '@/components/LoginForm'
import { MembershipPlans } from '@/components/MembershipPlans'
import { SignOutButton } from '@/components/SignOutButton'

export const metadata: Metadata = {
  title: 'Become a member · SharkFest',
}

// Look up the real recurring prices so the page shows accurate amounts.
async function fetchPrices(): Promise<{ individual: number | null; family: number | null }> {
  const key = process.env.STRIPE_SECRET_KEY
  const individualId = memberPriceId('individual')
  const familyId = memberPriceId('family')
  if (!key || (!individualId && !familyId)) return { individual: null, family: null }
  const stripe = new Stripe(key)
  const get = async (id: string | null) => {
    if (!id) return null
    try {
      const price = await stripe.prices.retrieve(id)
      return price.unit_amount ?? null
    } catch {
      return null
    }
  }
  const [individual, family] = await Promise.all([get(individualId), get(familyId)])
  return { individual, family }
}

const BENEFITS = [
  { icon: '🎟️', title: 'Members-only festival', body: 'SharkFest 2027 is exclusive to members — your membership unlocks registration, with a discount applied automatically to your booking.' },
  { icon: '📸', title: 'Exclusive content', body: 'Behind-the-scenes stories, photos and updates between festivals.' },
  { icon: '💳', title: 'Digital membership card', body: 'Your own branded membership pass, ready on your phone.' },
  { icon: '🎉', title: 'Members events', body: 'Invitations to socials and gatherings through the year.' },
]

export default async function JoinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user
  const membership = user ? await getActiveMembership(user.id) : null
  const prices = await fetchPrices()
  const discount = memberDiscountPercent()

  return (
    <>
      <header className="rc-header">
        <Link href="/" className="rc-header-logo" aria-label="Back to SharkFest">
          <Image src="/logo.png" alt="Torbay Sharks RFC" width={36} height={36} />
          <span>SharkFest</span>
        </Link>
        <nav className="rc-header-nav" aria-label="Site navigation">
          <Link href="/#2026">2026</Link>
          <Link href="/community">Photos</Link>
          {membership ? (
            <>
              <Link href="/members" className="btn btn-accent" style={{ fontSize: '0.8125rem', height: '2.25rem', padding: '0 1.125rem' }}>Members area</Link>
              <SignOutButton className="rc-header-signout" />
            </>
          ) : isLoggedIn ? (
            <>
              <Link href="/my-booking" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--grey-400)' }}>My booking</Link>
              <SignOutButton className="rc-header-signout" />
            </>
          ) : null}
        </nav>
      </header>

      <main className="join-wrap">
        <section className="join-hero">
          <p className="join-eyebrow">Torbay Sharks · Membership</p>
          <h1 className="join-title">Stay part of SharkFest, all year round</h1>
          <p className="join-lede">
            SharkFest 2026 is done and 2027 — our 25th anniversary — is confirmed. Membership
            is your way in: registration for the festival is exclusive to members, with the
            community kept alive all year round.
          </p>
        </section>

        <section className="join-benefits">
          {BENEFITS.map(b => (
            <div className="relive-card join-benefit" key={b.title}>
              <span className="join-benefit-icon" aria-hidden="true">{b.icon}</span>
              <p className="relive-card-title join-benefit-title">{b.title}</p>
              <p className="relive-card-body">{b.body}</p>
            </div>
          ))}
        </section>

        <section className="join-action">
          {membership ? (
            <div className="join-already">
              <p className="join-already-title">You&apos;re already a member 🦈</p>
              <p className="join-already-sub">Thanks for supporting the club.</p>
              <Link href="/members" className="btn btn-accent join-cta">Go to members area</Link>
            </div>
          ) : user ? (
            <MembershipPlans prices={prices} discountPercent={discount} />
          ) : (
            <Suspense fallback={<div className="auth-card" style={{ minHeight: 260 }} />}>
              {/* Send them back to /join after sign-in so they land on the plan
                  picker (not the empty booking page) to finish becoming a member. */}
              <LoginForm defaultNext="/join" />
            </Suspense>
          )}
        </section>
      </main>

      <footer className="footer" style={{ marginTop: '4rem' }}>
        <Image src="/logo.png" alt="Torbay Sharks RFC" width={44} height={44} className="footer-logo-img" />
        <p className="footer-wordmark">SHARKFEST</p>
        <p className="footer-sub">Torbay Sharks RFC · Devon Coast</p>
        <nav className="footer-links">
          <Link href="/">Home</Link>
          <Link href="/members">Members area</Link>
        </nav>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </>
  )
}
