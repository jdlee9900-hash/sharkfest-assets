import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ScrollReveal } from '@/components/ScrollReveal'
import { Countdown2027 } from '@/components/Countdown2027'

// Direct-link only while we build it out — keep it off search engines and
// don't link it from anywhere on the main site yet.
export const metadata: Metadata = {
  title: 'SharkFest 2027 · 25th Anniversary — Torbay Sharks RFC',
  description:
    'SharkFest 2027 — our Silver 25th Anniversary. May Bank Holiday, 28–31 May 2027. Devon Coast.',
  robots: { index: false, follow: false },
}

const DAYS = [
  {
    num: '01',
    day: 'Friday',
    date: '28 May',
    icon: '🎸',
    tag: 'Arrival Night',
    title: 'Gates Open',
    body: 'Roll in, pitch up and settle into the weekend. The bar is open and an indie covers band kicks things off under the marquee.',
    pills: ['Arrivals', 'Indie Covers Band', 'Marquee Bar'],
  },
  {
    num: '02',
    day: 'Saturday',
    date: '29 May',
    icon: '🪩',
    tag: 'The Big One',
    title: '25th Anniversary Party',
    body: 'Twenty-five years of SharkFest. Ibiza vibes through the day rolling into a full 90s party night — and a silver dress theme to make it sparkle.',
    pills: ['Ibiza Vibes', "90s Party Night", '✨ Silver Dress Theme'],
    feature: true,
  },
  {
    num: '03',
    day: 'Sunday',
    date: '30 May',
    icon: '🤠',
    tag: 'Boots & Band',
    title: 'Line Dancing & Country Night',
    body: 'Daytime line dancing sessions for all abilities, then a live country dance band sees out the evening in style.',
    pills: ['Line Dancing Sessions', 'Live Country Dance Band'],
  },
  {
    num: '04',
    day: 'Monday',
    date: '31 May',
    icon: '🌅',
    tag: 'Farewell',
    title: 'Bank Holiday Wind-down',
    body: 'A relaxed last morning together before the pack heads home. Breakfast, goodbyes and a slow pack-down.',
    pills: ['Breakfast', 'Departures'],
  },
]

export default function Festival2027Page() {
  return (
    <div className="f27">
      {/* ── Topbar ──────────────────────────────── */}
      <header className="f27-header">
        <Link href="/" className="f27-header-logo" aria-label="Back to SharkFest">
          <Image src="/logo.png" alt="Torbay Sharks RFC" width={36} height={36} />
          <span>SharkFest</span>
        </Link>
        <span className="f27-header-badge">Planning · 2027</span>
      </header>

      {/* ── Hero ────────────────────────────────── */}
      <section className="f27-hero">
        <div className="f27-sparkles" aria-hidden="true" />
        <div className="f27-hero-glow" aria-hidden="true" />

        <div className="f27-hero-inner">
          <Image src="/logo.png" alt="Torbay Sharks RFC" width={200} height={200} className="f27-hero-logo" priority />

          <p className="f27-eyebrow">Torbay Sharks RFC · Silver Anniversary</p>

          <h1 className="f27-title">SharkFest 2027</h1>

          <div className="f27-anniversary">
            <span className="f27-anniversary-num">25</span>
            <span className="f27-anniversary-txt">Years<br />of SharkFest</span>
          </div>

          <p className="f27-date">
            <strong>28 – 31 May 2027</strong> · May Bank Holiday Weekend
          </p>

          <Countdown2027 />

          <p className="f27-hero-sub">
            A quarter of a century of the festival we love — celebrated in glistening
            silver. Three nights of music, dancing and one very special anniversary party.
          </p>
        </div>

        <div className="f27-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 56" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,28 C240,56 480,0 720,28 C960,56 1200,0 1440,28 L1440,56 L0,56 Z" fill="var(--off-white)" />
          </svg>
        </div>
      </section>

      {/* ── The Weekend ─────────────────────────── */}
      <section className="f27-weekend">
        <div className="f27-inner">
          <ScrollReveal>
            <div className="f27-section-label">
              <span className="f27-label-line" />
              The Weekend
              <span className="f27-label-line" />
            </div>
            <h2 className="f27-section-title">Four days.<br />One silver celebration.</h2>
            <p className="f27-section-sub">
              Here&apos;s how the May Bank Holiday is shaping up. We&apos;re still building it
              out, so expect more to be added as we go.
            </p>
          </ScrollReveal>

          <div className="f27-days">
            {DAYS.map((d, i) => (
              <ScrollReveal key={d.day} delay={i * 80}>
                <article className={`f27-day-card${d.feature ? ' f27-day-card--feature' : ''}`}>
                  <span className="f27-day-num" aria-hidden="true">{d.num}</span>
                  <span className="f27-day-icon">{d.icon}</span>
                  <p className="f27-day-meta">
                    <span className="f27-day-name">{d.day}</span>
                    <span className="f27-day-date">{d.date}</span>
                  </p>
                  <p className="f27-day-tag">{d.tag}</p>
                  <h3 className="f27-day-title">{d.title}</h3>
                  <p className="f27-day-body">{d.body}</p>
                  <ul className="f27-day-pills">
                    {d.pills.map(p => (
                      <li key={p} className="f27-pill">{p}</li>
                    ))}
                  </ul>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Silver dress theme ──────────────────── */}
      <section className="f27-dress">
        <div className="f27-sparkles f27-sparkles--soft" aria-hidden="true" />
        <div className="f27-inner f27-dress-inner">
          <ScrollReveal>
            <p className="f27-dress-eyebrow">Saturday Dress Theme</p>
            <h2 className="f27-dress-title">Dress to <span className="f27-shine">shine</span> — Silver</h2>
            <p className="f27-dress-body">
              For the 25th Anniversary party, the theme is <strong>silver</strong>. Sequins,
              glitter, metallics, a shimmer of disco — however you wear it, bring the sparkle.
              The more the marquee glistens, the better.
            </p>
            <div className="f27-dress-tags">
              <span className="f27-pill f27-pill--lg">✨ Sequins</span>
              <span className="f27-pill f27-pill--lg">🪩 Disco Silver</span>
              <span className="f27-pill f27-pill--lg">💿 Metallics</span>
              <span className="f27-pill f27-pill--lg">🌟 Glitter</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────── */}
      <footer className="f27-footer">
        <Image src="/logo.png" alt="Torbay Sharks RFC" width={48} height={48} className="footer-logo-img" />
        <p className="f27-footer-wordmark">SHARKFEST 2027</p>
        <p className="f27-footer-sub">25th Anniversary · Torbay Sharks RFC · Devon Coast</p>
        <p className="f27-footer-note">
          This page is a work in progress while we plan the festival. Details may change.
        </p>
        <p className="footer-copy">© 2027 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </div>
  )
}
