import Image from 'next/image'
import { CountdownTimer } from '@/components/CountdownTimer'
import { OceanCanvas } from '@/components/OceanCanvas'

const PHOTOS = [
  { src: '/gallery/2026/PXL_20260524_094219679.jpg',    alt: 'SharkFest 2026 — festival atmosphere' },
  { src: '/gallery/2026/PXL_20260524_094220066.jpg',    alt: 'SharkFest 2026 — crowd' },
  { src: '/gallery/2026/PXL_20260524_094231598.jpg',    alt: 'SharkFest 2026 — live music' },
  { src: '/gallery/2026/PXL_20260524_094232166.jpg',    alt: 'SharkFest 2026 — main stage' },
  { src: '/gallery/2026/PXL_20260524_094234189.jpg',    alt: 'SharkFest 2026 — festival grounds' },
  { src: '/gallery/2026/PXL_20260524_094237321.MP.jpg', alt: 'SharkFest 2026 — Devon coast' },
  { src: '/gallery/2026/PXL_20260524_094238702.jpg',    alt: 'SharkFest 2026 — camping' },
  { src: '/gallery/2026/PXL_20260524_094239199.jpg',    alt: 'SharkFest 2026 — sunset' },
]

const RELIVE = [
  {
    icon: '📸',
    bg:   'rgba(251,191,36,0.12)',
    tag:  'Gallery',
    title: 'Full photo album',
    body:  'Every shot from the three days — browse, download, and share the memories.',
  },
  {
    icon: '🎬',
    bg:   'rgba(56,189,248,0.12)',
    tag:  'Highlights',
    title: 'Watch the highlights',
    body:  'The best moments from the main stage, the village, and the pitches — coming soon.',
  },
  {
    icon: '📝',
    bg:   'rgba(34,197,94,0.12)',
    tag:  'Recap',
    title: 'Read the wrap-up',
    body:  'Numbers, stories, and honest reflections on what made SharkFest 2026 special.',
  },
]

export default function Page() {
  return (
    <>
      {/* ══════════════════ HERO ══════════════════ */}
      <section className="hero">
        {/* Animated ocean canvas background */}
        <OceanCanvas />
        <div className="hero-overlay" aria-hidden="true" />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="Torbay Sharks RFC"
            width={140}
            height={140}
            className="hero-logo"
            priority
          />

          <p className="hero-eyebrow">Torbay Sharks RFC · Devon Coast</p>

          <h1 className="hero-title">SharkFest 2028</h1>

          <p className="hero-meta">
            <strong>26 – 29 May 2028</strong>
            &ensp;·&ensp;Three days&ensp;·&ensp;Two stages&ensp;·&ensp;One pack of sharks
          </p>

          {/* Stats pills */}
          <div className="hero-stats">
            {[
              { value: '42',  label: 'acts' },
              { value: '216', label: 'pitches' },
              { value: '3',   label: 'days' },
              { value: '4th', label: 'year' },
            ].map(s => (
              <div key={s.label} className="hero-stat-pill">
                <span className="hero-stat-value">{s.value}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          <CountdownTimer />

          <div className="hero-cta">
            <a
              href="mailto:hello@torbaySharks.co.uk?subject=SharkFest 2028 interest"
              className="btn btn-accent"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              Register interest
            </a>
            <a href="#2026" className="btn btn-outline">
              Relive 2026
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="scroll-hint" aria-hidden="true">
          <span>scroll</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </div>

        {/* Wave divider → off-white */}
        <div className="hero-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,32 C360,64 720,0 1080,32 C1260,48 1380,20 1440,32 L1440,64 L0,64 Z" fill="#fafaf9"/>
          </svg>
        </div>
      </section>

      {/* ══════════════════ THANK YOU 2026 ══════════════════ */}
      <section className="thankyou" id="2026">
        <div className="section-inner">
          <p className="section-eyebrow">SharkFest 2026</p>
          <h2 className="section-title">Thank you. That was special.</h2>
          <p className="section-subtitle">
            Over three days on the Devon coast, you made SharkFest 2026 something
            we&apos;ll never forget. Here&apos;s a look back at what we all built together.
          </p>

          <div className="photo-grid" role="list" aria-label="Photos from SharkFest 2026">
            {PHOTOS.map((photo, i) => (
              <div key={i} className="photo-item" role="listitem">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  priority={i < 3}
                />
                <div className="photo-overlay" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ RE-LIVE ══════════════════ */}
      <section className="relive" id="relive">
        <div className="section-inner">
          <p className="section-eyebrow">Coming soon</p>
          <h2 className="section-title">Re-live the festival</h2>
          <p className="section-subtitle">
            More from SharkFest 2026 is on its way — full gallery, highlight reel, and a proper write-up.
          </p>

          <div className="relive-grid">
            {RELIVE.map(card => (
              <div key={card.tag} className="relive-card">
                <div className="relive-card-icon" style={{ background: card.bg }}>
                  {card.icon}
                </div>
                <p className="relive-card-tag">{card.tag}</p>
                <h3 className="relive-card-title">{card.title}</h3>
                <p className="relive-card-body">{card.body}</p>
                <span className="relive-card-coming">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Coming soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="footer">
        <Image
          src="/logo.png"
          alt="Torbay Sharks RFC"
          width={56}
          height={56}
          className="footer-logo-img"
        />
        <p className="footer-wordmark">SHARKFEST</p>
        <p className="footer-sub">Torbay Sharks RFC · Devon Coast</p>
        <nav className="footer-links" aria-label="Footer links">
          <a href="mailto:hello@torbaySharks.co.uk">Contact</a>
          <a href="#2026">SharkFest 2026</a>
          <a href="#relive">Highlights</a>
        </nav>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </>
  )
}
