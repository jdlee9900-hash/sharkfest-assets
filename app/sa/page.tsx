import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SaTourInterestForm } from '@/components/SaTourInterestForm'
import './tour.css'

// Unlinked page — reachable by direct URL only, kept out of search indexes.
export const metadata: Metadata = {
  title: 'Sharks Tour — KwaZulu-Natal & Zululand · SharkFest',
  description: 'Sharks on tour, South Africa 2028 — three centres, three matches, one pack of Sharks under African skies.',
  robots: { index: false, follow: false },
}

const RugbyBallIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-30 12 12)" />
    <path d="M7 17 L17 7" /><path d="M9.5 14.5 L8 13" /><path d="M11 13 L9.5 11.5" /><path d="M12.5 11.5 L11 10" /><path d="M14 10 L12.5 8.5" /><path d="M15.5 8.5 L14 7" />
  </svg>
)

const CoachIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 6v6" /><path d="M15 6v6" /><path d="M2 12h19.6" />
    <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
    <circle cx="7" cy="18" r="2" /><path d="M9 18h5" /><circle cx="16" cy="18" r="2" />
  </svg>
)

const HotelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" /><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /><path d="M2 17h20" /><path d="M6 8v2" /><path d="M18 8v2" />
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export default function SaTourPage() {
  return (
    <div className="sa-page">
      <header className="rc-header">
        <Link href="/" className="rc-header-logo" aria-label="Back to SharkFest">
          <Image src="/logo.png" alt="Torbay Sharks RFC" width={36} height={36} />
          <span>SharkFest</span>
        </Link>
        <nav className="rc-header-nav" aria-label="Site navigation">
          <a href="#register" className="btn btn-accent" style={{ fontSize: '0.8125rem', height: '2.25rem', padding: '0 1.125rem' }}>
            Register interest
          </a>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="sa-hero">
        {/* Placeholder photography — swap for the club's own tour shots when ready */}
        <img
          className="sa-hero-photo"
          src="https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=2000&q=80"
          alt=""
        />
        <div className="sa-hero-scrim" aria-hidden="true" />
        <div className="sa-hero-sunset" aria-hidden="true" />
        <div className="sa-hero-grid" aria-hidden="true" />
        <div className="sa-hero-inner">
          <span className="sa-eyebrow">Sharks on tour · South Africa · 20—31 May 2028</span>
          <h1>KWAZULU-NATAL<br />&amp; ZULULAND</h1>
          <p className="sa-hero-sub">Three centres. Three matches. One pack of Sharks under African skies.</p>
          <div className="sa-stat-row">
            <span className="sa-stat-pill"><strong>10</strong>nights</span>
            <span className="sa-stat-pill"><strong>3</strong>centres</span>
            <span className="sa-stat-pill"><strong>3</strong>matches</span>
            <span className="sa-stat-pill"><strong>BIG 5</strong>on the game drives</span>
          </div>
          <div className="sa-cta-row">
            <a className="btn btn-accent" style={{ height: '3rem', padding: '0 1.75rem' }} href="#register">Register interest</a>
            <a className="sa-btn-ghost" href="#journey">See the journey</a>
          </div>
          <div className="sa-route-card">
            <div className="sa-route-label"><span className="sa-pulse-dot" aria-hidden="true" />The route</div>
            <div className="sa-route-line">
              <span className="stop">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                DUR
              </span>
              <span className="arrow" aria-hidden="true">→</span>
              <span className="stop">UMHLANGA ROCKS</span>
              <span className="arrow" aria-hidden="true">→</span>
              <span className="stop">HLUHLUWE</span>
              <span className="arrow" aria-hidden="true">→</span>
              <span className="stop">ZINKWAZI BEACH</span>
              <span className="arrow" aria-hidden="true">→</span>
              <span className="stop">DUR</span>
            </div>
            <p className="sa-route-note">
              You book your own flights into <strong>Durban (DUR)</strong>. Everything on the ground is
              sorted — beds, breakfasts, luxury coaches, matches, game drives and every braai.
              Porter and driver tips included.
            </p>
          </div>
        </div>
      </section>

      {/* ── The journey ──────────────────────────────────────── */}
      <section className="sa-journey" id="journey">
        <div className="sa-journey-header">
          <span className="sa-eyebrow-earth">The journey</span>
          <h2>THREE CENTRES,<br />NORTH UP THE COAST.</h2>
          <p>
            After last year&apos;s Cape Town trip we&apos;re heading to the cane fields of KwaZulu-Natal —
            the gaffer&apos;s old stomping ground. Sea-front start, into the bush, then four nights to
            wind it all down.
          </p>
        </div>

        <div className="sa-connector" aria-hidden="true">
          <span className="transfer"><CoachIcon />Durban arrivals · 25 km by coach</span>
          <span className="line" />
        </div>

        {/* Leg 01 — Umhlanga Rocks */}
        <article className="sa-leg" style={{ '--leg-accent': 'var(--tour-a1)' } as React.CSSProperties}>
          <div className="sa-leg-photo">
            <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80" alt="Beachfront on the Indian Ocean" />
            <span className="sa-photo-tag">UMHLANGA · INDIAN OCEAN</span>
          </div>
          <div className="sa-leg-body">
            <span className="sa-ghost-num" aria-hidden="true">01</span>
            <div className="sa-leg-tag-row">
              <span className="sa-leg-tag">The arrival</span>
              <span className="sa-leg-nights">Nights 1–3</span>
            </div>
            <h3>UMHLANGA ROCKS</h3>
            <p className="sa-leg-quote">Sea-front start, 25 km north of Durban.</p>
            <ul className="sa-leg-list">
              <li><HotelIcon /><span><strong>4★ resort on the beachfront</strong> — three nights, family rooms, buffet breakfast every day</span></li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
                <span><strong>Welcome-to-South-Africa buffet dinner</strong> for the whole tour party, day 2</span>
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 22V4c0-.6.4-1 1-1h14c.6 0 1 .4 1 1v6c0 .6-.4 1-1 1H5"/></svg>
                <span><strong>Full golf day at Mount Edgcumbe Country Club</strong> — buggies, green fees and club hire all in</span>
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                <span><strong>A proper day out</strong> for everyone not chasing a golf ball</span>
              </li>
            </ul>
            <div className="sa-match-strip">
              <RugbyBallIcon />
              <span>Match 1 · Sharks <span className="vs">v</span> Hillcrest Villagers RFC · full braai after</span>
            </div>
          </div>
        </article>

        <div className="sa-connector" aria-hidden="true">
          <span className="line" />
          <span className="transfer"><CoachIcon />Coach north into the bush · ±3 hrs</span>
          <span className="line" />
        </div>

        {/* Leg 02 — Hluhluwe */}
        <article className="sa-leg flip" style={{ '--leg-accent': 'var(--tour-a2)' } as React.CSSProperties}>
          <div className="sa-leg-photo">
            <img src="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80" alt="African elephant in the bush" />
            <span className="sa-photo-tag">HLUHLUWE · ZULULAND</span>
          </div>
          <div className="sa-leg-body">
            <span className="sa-ghost-num" aria-hidden="true">02</span>
            <div className="sa-leg-tag-row">
              <span className="sa-leg-tag">The bush</span>
              <span className="sa-leg-nights">Nights 4–6</span>
            </div>
            <h3>HLUHLUWE</h3>
            <p className="sa-leg-quote">Pronounced shh-shloo-ey. You&apos;ll have it by day two.</p>
            <ul className="sa-leg-list">
              <li><HotelIcon /><span><strong>Game lodge in the heart of Zululand</strong> — three nights, dinner and breakfast included</span></li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>
                <span><strong>Two game drives</strong> — Hluhluwe National Park and Bonamanzi Private Reserve. Lion, rhino, hippo, elephant, buffalo</span>
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2 2 8 8"/><path d="m22 2-8 8"/><ellipse cx="12" cy="9" rx="10" ry="5"/><path d="M7 13.4v7.9"/><path d="M12 14v8"/><path d="M17 13.4v7.9"/><path d="M2 9v8a10 5 0 0 0 20 0V9"/></svg>
                <span><strong>Zulu village cultural visit</strong> — tour the kraal, watch the stick dancing</span>
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/></svg>
                <span><strong>Bayete Elephant Experience</strong> — get up close to African elephants</span>
              </li>
            </ul>
            <div className="sa-match-strip">
              <RugbyBallIcon />
              <span>Match 2 · Sharks <span className="vs">v</span> Hluhluwe RFC · in the heart of the village · braai after</span>
            </div>
          </div>
        </article>

        <div className="sa-connector" aria-hidden="true">
          <span className="line" />
          <span className="transfer"><CoachIcon />Coach south down the coast · ±2 hrs</span>
          <span className="line" />
        </div>

        {/* Leg 03 — Zinkwazi Beach */}
        <article className="sa-leg" style={{ '--leg-accent': 'var(--tour-a3)' } as React.CSSProperties}>
          <div className="sa-leg-photo">
            <img src="https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80" alt="Quiet beach at golden hour" />
            <span className="sa-photo-tag">ZINKWAZI · NORTH COAST</span>
          </div>
          <div className="sa-leg-body">
            <span className="sa-ghost-num" aria-hidden="true">03</span>
            <div className="sa-leg-tag-row">
              <span className="sa-leg-tag">The chill-down</span>
              <span className="sa-leg-nights">Nights 7–10</span>
            </div>
            <h3>ZINKWAZI BEACH</h3>
            <p className="sa-leg-quote">Four nights in a sleepy village to wind it all down.</p>
            <ul className="sa-leg-list">
              <li><HotelIcon /><span><strong>4★ resort B&amp;B on the Indian Ocean</strong> — four nights, three-bedroomed family units</span></li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"/></svg>
                <span><strong>Ski-boat fishing off the beach</strong> for the players — bring your sea legs</span>
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
                <span><strong>A day at the Zinkwazi Ski Boat Club</strong> — dinner, drinks and the tour court session</span>
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                <span><strong>End-of-tour dinner and the big bash braai</strong> on the beach</span>
              </li>
            </ul>
            <div className="sa-match-strip">
              <RugbyBallIcon />
              <span>Match 3 · Sharks <span className="vs">v</span> Ballito Dolphins · full braai after</span>
            </div>
          </div>
        </article>
      </section>

      {/* ── Register interest ────────────────────────────────── */}
      <section className="sa-register" id="register">
        <div className="sa-register-sunset" aria-hidden="true" />
        <div className="sa-register-inner">
          <div className="sa-register-copy">
            <span className="sa-eyebrow-dark">Register interest</span>
            <h2>GET YOUR<br />NAME DOWN.</h2>
            <p className="sa-lead-dark">
              You book the flights into <strong>Durban</strong> — we sort everything on the ground.{' '}
              <strong>Lodge beds set the cap</strong> on numbers, so the earlier you&apos;re on the list,
              the better your shout.
            </p>
            <ul className="sa-points">
              <li><CheckIcon /><span>Buffet breakfast every day; welcome dinner, three braais, three lodge dinners, the ski-boat club day and the end-of-tour dinner all included</span></li>
              <li><CheckIcon /><span>All transfers in luxury coaches, porter and driver tips covered</span></li>
              <li><CheckIcon /><span>Playing kit and tour kit included — and something for the ladies and the kids</span></li>
            </ul>
          </div>
          <SaTourInterestForm />
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="footer">
        <Image src="/logo.png" alt="Torbay Sharks RFC" width={44} height={44} className="footer-logo-img" />
        <p className="footer-wordmark">SHARKS ON TOUR</p>
        <p className="footer-sub">Torbay Sharks RFC · Devon Coast</p>
        <nav className="footer-links" aria-label="Footer links">
          <Link href="/">SharkFest home</Link>
          <a href="#journey">The journey</a>
          <a href="#register">Register interest</a>
          <a href="mailto:hello@torbaySharks.co.uk">Contact</a>
        </nav>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </div>
  )
}
