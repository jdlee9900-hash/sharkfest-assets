import Image from 'next/image'
import { CountdownTimer } from '@/components/CountdownTimer'

// ── Photos from the 2026 festival ──────────────────────────────────────────
const PHOTOS = [
  { src: '/gallery/2026/PXL_20260524_094219679.jpg',      alt: 'SharkFest 2026 — festival atmosphere' },
  { src: '/gallery/2026/PXL_20260524_094220066.jpg',      alt: 'SharkFest 2026 — crowd scene' },
  { src: '/gallery/2026/PXL_20260524_094231598.jpg',      alt: 'SharkFest 2026 — live music' },
  { src: '/gallery/2026/PXL_20260524_094232166.jpg',      alt: 'SharkFest 2026 — main stage' },
  { src: '/gallery/2026/PXL_20260524_094234189.jpg',      alt: 'SharkFest 2026 — festival grounds' },
  { src: '/gallery/2026/PXL_20260524_094237321.MP.jpg',   alt: 'SharkFest 2026 — Devon coast views' },
  { src: '/gallery/2026/PXL_20260524_094238702.jpg',      alt: 'SharkFest 2026 — camping area' },
  { src: '/gallery/2026/PXL_20260524_094239199.jpg',      alt: 'SharkFest 2026 — sunset' },
]

// ── Re-live cards ──────────────────────────────────────────────────────────
const RELIVE = [
  {
    icon: '📸',
    bg:   '#fef3c7',
    tag:  'Gallery',
    title: 'Full photo album',
    body:  'Every shot from the three days — browse, download, and share the memories.',
  },
  {
    icon: '🎬',
    bg:   '#ede9fe',
    tag:  'Highlights',
    title: 'Watch the highlights',
    body:  'The best moments from the main stage, the village, and the pitches — coming soon.',
  },
  {
    icon: '📝',
    bg:   '#dcfce7',
    tag:  'Recap',
    title: 'Read the wrap-up',
    body:  'Numbers, stories, and a few honest reflections on what made 2026 special.',
  },
]

export default function Page() {
  return (
    <>
      {/* ══════════════════ HERO ══════════════════ */}
      <section className="hero">
        <div className="hero-shimmer" aria-hidden="true" />

        {/* Shark fin SVG */}
        <svg className="shark-fin" viewBox="0 0 80 100" fill="currentColor" aria-hidden="true" style={{ color: '#00c9b1' }}>
          <path d="M40 0 C 40 0, 80 60, 80 90 L 0 90 C 10 70, 20 40, 40 0Z" />
          <ellipse cx="40" cy="90" rx="40" ry="8" opacity="0.3" />
        </svg>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p className="hero-eyebrow">Torbay Sharks RFC · Devon Coast</p>

          <h1 className="hero-title">
            Shark<span>Fest</span>
            <span style={{ display: 'block', fontSize: '0.65em', WebkitTextFillColor: '#e8f4ff', backgroundImage: 'none' }}>
              2028
            </span>
          </h1>

          <p className="hero-meta">
            <strong>26 – 29 May 2028</strong> &nbsp;·&nbsp; Three days &nbsp;·&nbsp; Two stages &nbsp;·&nbsp; One pack of sharks
          </p>

          <CountdownTimer />

          <div className="hero-cta">
            <a
              href="mailto:hello@torbaySharks.co.uk?subject=SharkFest 2028 interest"
              className="btn btn-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.209 0 4 1.791 4 4v8Z"/>
                <polyline points="15,9 12,12 9,9"/>
              </svg>
              Register interest
            </a>
            <a href="#2026" className="btn btn-ghost">
              Relive 2026
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            </a>
          </div>
        </div>

        {/* scroll hint */}
        <div className="scroll-hint" aria-hidden="true">
          <span>scroll</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </div>

        {/* Wave divider */}
        <div className="hero-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path
              d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z"
              fill="#f9f7f4"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════ THANK YOU 2026 ══════════════════ */}
      <section className="thankyou" id="2026">
        <div className="thankyou-inner">
          <p className="section-eyebrow">SharkFest 2026</p>
          <h2 className="section-title">Thank you. That was special.</h2>
          <p className="section-subtitle">
            Over three days on the Devon coast, you made SharkFest 2026 something we&apos;ll
            never forget. Here&apos;s a look back at what we all built together.
          </p>

          {/* Photo grid */}
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
                <div className="photo-overlay">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                    <path d="M11 8v6M8 11h6"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ RE-LIVE ══════════════════ */}
      <section className="relive" id="relive">
        <div className="relive-inner">
          <p className="section-eyebrow">Coming soon</p>
          <h2 className="section-title" style={{ color: 'var(--warm-text)' }}>Re-live the festival</h2>
          <p className="section-subtitle">
            More from SharkFest 2026 is on its way — full gallery, highlight reel, and a proper write-up.
          </p>

          <div className="relive-grid">
            {RELIVE.map((card) => (
              <div key={card.tag} className="relive-card">
                <div className="relive-card-icon" style={{ background: card.bg }}>
                  {card.icon}
                </div>
                <p className="relive-card-tag">{card.tag}</p>
                <h3 className="relive-card-title">{card.title}</h3>
                <p className="relive-card-body">{card.body}</p>
                <span className="relive-card-coming">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
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
        <p className="footer-logo">SHARKFEST</p>
        <p className="footer-sub">Torbay Sharks RFC · Devon Coast</p>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="mailto:hello@torbaySharks.co.uk">Contact</a>
          <a href="#2026">SharkFest 2026</a>
          <a href="https://torbaySharks.co.uk" rel="noopener noreferrer">Torbay Sharks RFC</a>
        </nav>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </>
  )
}
