import Image from 'next/image'
import Link from 'next/link'
import { CountdownTimer }   from '@/components/CountdownTimer'
import { OceanCanvas }      from '@/components/OceanCanvas'
import { Marquee }           from '@/components/Marquee'
import { ScrollReveal }      from '@/components/ScrollReveal'
import { AnimatedCounter }   from '@/components/AnimatedCounter'

const STATS = [
  { value: 830, label: 'Attendees', suffix: '+' },
  { value: 3,   label: 'Headline Acts' },
  { value: 3,   label: 'Days' },
  { value: 216, label: 'Pitches' },
]

const NIGHTS = [
  { day: 'Friday',   theme: 'The Shrine',                    act: 'The Shrine',            icon: '🎸' },
  { day: 'Saturday', theme: 'Hawaiian Night',                 act: 'Break Beat Bandits',    icon: '🌺' },
  { day: 'Sunday',   theme: "70's Night",                     act: 'FLAIRZ',                icon: '🕺' },
]

const RELIVE = [
  { num: '01', icon: '📸', tag: 'Your Photos',  title: 'Community gallery',       body: 'Upload your shots from the weekend — the good, the muddy, the golden.', href: '/community' },
  { num: '02', icon: '🏃', tag: 'Run Club',     title: 'Festival run photos',     body: '182 photos from the morning run — Devon coast at its finest.',             href: '/run-club'  },
  { num: '03', icon: '📝', tag: 'Recap',        title: 'Read the wrap-up',        body: 'Numbers, stories, and honest reflections on what made SharkFest 2026 special.', href: null },
]

export default function Page() {
  return (
    <>
      {/* ══════════════════ HERO ══════════════════ */}
      <section className="hero">
        <OceanCanvas />
        <div className="hero-overlay" aria-hidden="true" />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Image src="/logo.png" alt="Torbay Sharks RFC" width={200} height={200} className="hero-logo" priority />

          <p className="hero-eyebrow">Torbay Sharks RFC · Devon Coast</p>

          <h1 className="hero-title">SharkFest 2028</h1>

          <p className="hero-date"><strong>Summer 2028</strong></p>

          <CountdownTimer />

          <div className="hero-cta">
            <a href="#2026" className="btn btn-outline">
              Relive 2026
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            </a>
          </div>
        </div>

        <div className="scroll-hint" aria-hidden="true">
          <span>scroll</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>

        <div className="hero-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 56" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,28 C240,56 480,0 720,28 C960,56 1200,0 1440,28 L1440,56 L0,56 Z" fill="#fbbf24"/>
          </svg>
        </div>
      </section>

      {/* ══════════════════ MARQUEE ══════════════════ */}
      <Marquee />

      {/* ══════════════════ THANK YOU 2026 ══════════════════ */}
      <section className="thankyou" id="2026">
        <div className="section-inner">

          <ScrollReveal>
            <div className="section-label">
              <span className="section-label-line" />
              SharkFest 2026
              <span className="section-label-line" />
            </div>
            <h2 className="section-title-lg">Thank you.<br />That was special.</h2>
          </ScrollReveal>

          {/* Cinematic quote */}
          <ScrollReveal delay={100}>
            <blockquote className="quote-block">
              Three Days, Two Marques, One Community. Nothing else competes.
            </blockquote>
          </ScrollReveal>

          {/* Animated stats */}
          <ScrollReveal delay={80}>
            <div className="stats-row">
              {STATS.map(s => (
                <AnimatedCounter key={s.label} value={s.value} label={s.label} suffix={s.suffix ?? ''} />
              ))}
            </div>
          </ScrollReveal>

          {/* Headline nights */}
          <ScrollReveal delay={100}>
            <div className="nights-label">
              <span className="nights-label-line" />
              3 Themed Headline Nights
              <span className="nights-label-line" />
            </div>
            <div className="nights-grid">
              {NIGHTS.map((n, i) => (
                <div key={n.day} className="night-card">
                  <span className="night-icon">{n.icon}</span>
                  <p className="night-day">{n.day}</p>
                  <p className="night-theme">{n.theme}</p>
                  <p className="night-act">{n.act}</p>
                  <span className="night-index">0{i + 1}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════ RE-LIVE ══════════════════ */}
      {/* wave transition off-white → navy */}
      <div className="relive-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,60 L0,60 Z" fill="#0f172a"/>
        </svg>
      </div>

      <section className="relive" id="relive">
        <div className="section-inner">

          <ScrollReveal>
            <div className="section-label" style={{ color: 'var(--gold-400)' }}>
              <span className="section-label-line" />
              Coming soon
              <span className="section-label-line" />
            </div>
            <h2 className="section-title-lg">Re-live<br />the festival</h2>
            <p className="section-sub" style={{ marginBottom: 0 }}>
              More from SharkFest 2026 is on its way — full gallery, highlight reel, and a proper write-up.
            </p>
          </ScrollReveal>

          <div className="relive-grid">
            {RELIVE.map((card, i) => (
              <ScrollReveal key={card.tag} delay={i * 80}>
                {card.href ? (
                  <Link href={card.href} className="relive-card relive-card--link">
                    <span className="relive-card-num" aria-hidden="true">{card.num}</span>
                    <div className="relive-card-icon">{card.icon}</div>
                    <p className="relive-card-tag">{card.tag}</p>
                    <h3 className="relive-card-title">{card.title}</h3>
                    <p className="relive-card-body">{card.body}</p>
                    <span className="relive-card-pill relive-card-pill--live">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      View now
                    </span>
                  </Link>
                ) : (
                  <div className="relive-card">
                    <span className="relive-card-num" aria-hidden="true">{card.num}</span>
                    <div className="relive-card-icon">{card.icon}</div>
                    <p className="relive-card-tag">{card.tag}</p>
                    <h3 className="relive-card-title">{card.title}</h3>
                    <p className="relive-card-body">{card.body}</p>
                    <span className="relive-card-pill">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Coming soon
                    </span>
                  </div>
                )}
              </ScrollReveal>
            ))}
          </div>

          {/* Notify CTA */}
          <ScrollReveal delay={160}>
            <div className="notify-strip">
              <p>Be the first to know when it&apos;s ready.</p>
              <a href="mailto:hello@torbaySharks.co.uk?subject=SharkFest 2026 highlights" className="btn btn-accent">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Notify me
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="footer">
        <Image src="/logo.png" alt="Torbay Sharks RFC" width={52} height={52} className="footer-logo-img" />
        <p className="footer-wordmark">SHARKFEST</p>
        <p className="footer-sub">Torbay Sharks RFC · Devon Coast</p>
        <nav className="footer-links" aria-label="Footer links">
          <a href="mailto:hello@torbaySharks.co.uk">Contact</a>
          <a href="#2026">SharkFest 2026</a>
          <a href="#relive">Highlights</a>
          <Link href="/run-club">Run Club</Link>
          <Link href="/community">Community Photos</Link>
          <a href="https://torbaySharks.co.uk" rel="noopener noreferrer">RFC website</a>
        </nav>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </>
  )
}
