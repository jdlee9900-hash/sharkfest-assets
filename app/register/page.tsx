import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { RegisterForm } from '@/components/RegisterForm'
import { getEvent, isRegistrationOpen } from '@/lib/events'

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ year?: string }> }
): Promise<Metadata> {
  const event = getEvent((await searchParams).year)
  return {
    title: `Register · ${event.name}`,
    description: `Register for ${event.name} — ${event.location}, ${event.dates}.`,
    // 2027 page is direct-link only for now — don't surface its register page either.
    ...(event.year === 2027 ? { robots: { index: false, follow: false } } : {}),
  }
}

export default async function RegisterPage(
  { searchParams }: { searchParams: Promise<{ year?: string }> }
) {
  const event = getEvent((await searchParams).year)
  const isOpen = isRegistrationOpen(event.year)

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
          <Link href="/my-booking" className="btn btn-accent" style={{ fontSize: '0.8125rem', height: '2.25rem', padding: '0 1.125rem' }}>
            My Booking
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="rc-hero">
        <div className="rc-hero-inner">
          <div className="section-label" style={{ color: 'var(--gold-400)', justifyContent: 'center' }}>
            <span className="section-label-line" />
            {event.name}
            <span className="section-label-line" />
          </div>
          <h1 className="rc-hero-title">
            {isOpen ? 'Register' : 'Coming Soon'}
          </h1>
          <p className="rc-hero-sub">
            {event.dates} · {event.location}
          </p>
        </div>
        <div className="hero-wave" style={{ zIndex: 2 }} aria-hidden="true">
          <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,24 C360,48 720,0 1080,24 C1260,36 1380,12 1440,24 L1440,48 L0,48 Z" fill="var(--off-white)"/>
          </svg>
        </div>
      </section>

      <main className="rc-gallery-wrap" style={{ paddingTop: '3rem' }}>
        {isOpen ? (
          <RegisterForm event={event} />
        ) : (
          <div className="reg-coming-soon">
            <div className="reg-cs-icon" aria-hidden="true">🦈</div>
            <h2 className="reg-cs-title">Registrations open soon</h2>
            <p className="reg-cs-sub">
              {event.name} registrations will open shortly.<br/>
              Keep an eye on our socials for the announcement.
            </p>
            <p className="reg-cs-sub" style={{ fontSize: '0.9rem', color: 'var(--grey-400)' }}>
              Already registered?{' '}
              <Link href="/login?next=/my-booking" className="reg-link">Sign in to your booking</Link>
            </p>
          </div>
        )}
      </main>

      <footer className="footer" style={{ marginTop: '4rem' }}>
        <Image src="/logo.png" alt="Torbay Sharks RFC" width={44} height={44} className="footer-logo-img" />
        <p className="footer-wordmark">SHARKFEST</p>
        <p className="footer-sub">Torbay Sharks RFC · Devon Coast</p>
        <nav className="footer-links">
          <Link href="/">Home</Link>
          <Link href="/#2026">SharkFest 2026</Link>
          <Link href="/community">Photos</Link>
        </nav>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </>
  )
}
