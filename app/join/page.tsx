import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership, memberPriceId, memberDiscountPercent } from '@/lib/membership'
import { LoginForm } from '@/components/LoginForm'
import { MembershipPlans } from '@/components/MembershipPlans'

export const metadata: Metadata = {
  title: 'Become a member · SharkFest',
}

// Look up the real recurring prices so the page shows accurate amounts.
async function fetchPrices(): Promise<{ monthly: number | null; annual: number | null }> {
  const key = process.env.STRIPE_SECRET_KEY
  const monthlyId = memberPriceId('monthly')
  const annualId = memberPriceId('annual')
  if (!key || (!monthlyId && !annualId)) return { monthly: null, annual: null }
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
  const [monthly, annual] = await Promise.all([get(monthlyId), get(annualId)])
  return { monthly, annual }
}

const BENEFITS = [
  { icon: '🎟️', title: 'Reduced 2028 tickets', body: 'Members get a discount on SharkFest 2028 registration, applied automatically to your booking.' },
  { icon: '📸', title: 'Exclusive content', body: 'Behind-the-scenes stories, photos and updates between festivals.' },
  { icon: '💳', title: 'Digital membership card', body: 'Your own branded membership pass, ready on your phone.' },
  { icon: '🎉', title: 'Members events', body: 'Invitations to socials and gatherings through the year.' },
]

export default async function JoinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
          <Link href="/register" className="btn btn-accent" style={{ fontSize: '0.8125rem', height: '2.25rem', padding: '0 1.125rem' }}>
            Register 2028
          </Link>
        </nav>
      </header>

      <main className="join-wrap">
        <section className="join-hero">
          <p className="join-eyebrow">Torbay Sharks · Membership</p>
          <h1 className="join-title">Stay part of SharkFest, all year round</h1>
          <p className="join-lede">
            SharkFest 2026 is done and 2028 is on the horizon. Become a member to keep the
            community alive between festivals — and get a reduced price when tickets open.
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
              <LoginForm />
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
          <Link href="/register">Register 2028</Link>
        </nav>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </>
  )
}
