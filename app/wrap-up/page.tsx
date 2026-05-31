import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Wrap-Up · SharkFest 2026 — Torbay Sharks RFC',
  description:
    'A thank-you from Russ a week on from SharkFest 2026 — the best one yet — plus a big bit of news for 2027.',
}

// Russ's roll-call of thank-yous, kept in his order.
const THANK_YOUS = [
  'Pete Prior-Sankey', 'Darren Sandercock', 'Si Baylie', 'Nev Carr', 'Mark Ware',
  'Ian Harvey', 'Hannah Dempsey', 'Phil Burford', 'Sheila Burford', 'Katrina Baker',
  'Jon Lee', 'The Bar Staff', 'Dan Force', 'The Physio Ladies',
  'The Coaches on Super Saturday', 'Dave Burford', 'Becky Bettesworth', 'Matt Bettesworth',
  'Lucy Venter', 'The Waterboys!', 'The Ball Boys & Girls', 'Barnstaple Vets',
  'Bideford Ladies', 'Pasty & the Old Grammarians', 'Mike Dymond & the University Medics',
  'The Referees!',
]

export default function WrapUpPage() {
  return (
    <>
      {/* ── Topbar ──────────────────────────────── */}
      <header className="rc-header">
        <Link href="/" className="rc-header-logo" aria-label="Back to SharkFest">
          <Image src="/logo.png" alt="Torbay Sharks RFC" width={36} height={36} />
          <span>SharkFest</span>
        </Link>
        <nav className="rc-header-nav" aria-label="Site navigation">
          <Link href="/#2026">2026</Link>
          <Link href="/community">Photos</Link>
          <Link href="/run-club">Run Club</Link>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────── */}
      <section className="rc-hero">
        <div className="rc-hero-inner">
          <div className="section-label" style={{ color: 'var(--gold-400)', justifyContent: 'center' }}>
            <span className="section-label-line" />
            SharkFest 2026 · The Wrap-Up
            <span className="section-label-line" />
          </div>
          <h1 className="rc-hero-title" style={{ fontSize: 'clamp(2.75rem, 9vw, 6rem)' }}>
            The best one yet
          </h1>
          <p className="rc-hero-sub">A thank-you from Russ, a week on from the festival.</p>
        </div>
        <div className="hero-wave" style={{ zIndex: 2 }} aria-hidden="true">
          <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,24 C360,48 720,0 1080,24 C1260,36 1380,12 1440,24 L1440,48 L0,48 Z" fill="var(--off-white)"/>
          </svg>
        </div>
      </section>

      {/* ── Article ─────────────────────────────── */}
      <main className="article-wrap">
        <article className="article">
          <p className="article-byline">
            <span className="article-byline-name">Russ</span>
            <span className="article-byline-dot" aria-hidden="true">·</span>
            <span>A week after SharkFest 2026</span>
          </p>

          <p className="article-lead">Good evening all,</p>

          <p>
            A week on from the festival, it feels like the right moment to sit down and say
            a proper thank you. Thank you to everyone who came along to <strong>SharkFest 2026</strong>,
            and to everyone who rolled up their sleeves to make it the best one yet.
          </p>

          <p>
            It&apos;s fair to say SharkFest has grown into something genuinely special — a
            warm, family-oriented festival that&apos;s become a real fixture in the calendar.
            Of course, there&apos;s a fair bit of hard graft that goes on behind the scenes to
            make sure it (mostly!) goes to plan, and none of it happens without a small army
            of brilliant people.
          </p>

          <p>
            So, in no particular order, my heartfelt thanks go to:
          </p>

          {/* Roll-call of thank-yous */}
          <ul className="article-thanks">
            {THANK_YOUS.map(name => (
              <li className="article-thanks-item" key={name}>
                <span className="article-thanks-mark" aria-hidden="true">🦈</span>
                {name}
              </li>
            ))}
          </ul>

          <p>
            And if I&apos;ve forgotten anyone — my humble apologies. You know who you are, and
            you know how much it&apos;s appreciated.
          </p>

          {/* What's next */}
          <h2 className="article-h2">A few positive changes ahead</h2>

          <p>
            There are some good things coming. First up, there&apos;ll be a brand-new{' '}
            <strong>SharkFest Committee</strong> to share the load and take a bit of the strain
            off me — which can only be a good thing for the festival.
          </p>

          <p>
            We&apos;re also launching a new <strong>Sharks Membership</strong> to keep the Sharks
            both exclusive <em>and</em> inclusive — full details to follow very soon.
          </p>

          {/* 2027 announcement */}
          <aside className="article-callout">
            <p className="article-callout-eyebrow">The big news</p>
            <h3 className="article-callout-title">SharkFest is back in 2027!</h3>
            <p className="article-callout-body">
              Yes — we&apos;re doing it again next year rather than waiting until 2029. Pop it in
              the diary now:
            </p>
            <p className="article-callout-dates">Friday 28th – Monday 31st May 2027</p>
            <p className="article-callout-note">Here&apos;s hoping that one goes down well with you all.</p>
          </aside>

          <p className="article-signoff">
            Thanks again, everyone. Here&apos;s to the next one.
          </p>
          <p className="article-signoff article-signoff--name">Russ</p>
        </article>

        <div className="article-back">
          <Link href="/#relive" className="btn btn-dark">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back to SharkFest 2026
          </Link>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────── */}
      <footer className="footer" style={{ marginTop: '4rem' }}>
        <Image src="/logo.png" alt="Torbay Sharks RFC" width={44} height={44} className="footer-logo-img" />
        <p className="footer-wordmark">SHARKFEST</p>
        <p className="footer-sub">Torbay Sharks RFC · Devon Coast</p>
        <nav className="footer-links">
          <Link href="/">Home</Link>
          <Link href="/#2026">SharkFest 2026</Link>
          <Link href="/community">Photos</Link>
          <Link href="/run-club">Run Club</Link>
        </nav>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </>
  )
}
