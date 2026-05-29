import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getFolder } from '@/lib/cloudinary'
import { RunClubGallery } from '@/components/RunClubGallery'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Run Club · SharkFest 2026',
  description: 'Photos from the SharkFest 2026 Run Club — Torbay Sharks RFC, Devon Coast.',
}

export default async function RunClubPage() {
  let images: Awaited<ReturnType<typeof getFolder>> = []
  let error: string | null = null

  try {
    images = await getFolder('run-club')
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error'
  }

  const noCredentials =
    !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET

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
          <Link href="/#relive">Highlights</Link>
          <Link href="/" className="btn btn-accent" style={{ fontSize: '0.8125rem', height: '2.25rem', padding: '0 1.125rem' }}>
            Register 2028
          </Link>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────── */}
      <section className="rc-hero">
        <div className="rc-hero-inner">
          <div className="section-label" style={{ color: 'var(--gold-400)', justifyContent: 'center' }}>
            <span className="section-label-line" />
            SharkFest 2026
            <span className="section-label-line" />
          </div>
          <h1 className="rc-hero-title">Run Club</h1>
          <p className="rc-hero-sub">
            {images.length > 0
              ? `${images.length} photos from the festival run — laps, muddy trainers, Devon coast views.`
              : 'Photos from the festival run — laps, muddy trainers, Devon coast views.'}
          </p>
        </div>

        {/* wave down to gallery */}
        <div className="hero-wave" style={{ zIndex: 2 }} aria-hidden="true">
          <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,24 C360,48 720,0 1080,24 C1260,36 1380,12 1440,24 L1440,48 L0,48 Z" fill="var(--off-white)"/>
          </svg>
        </div>
      </section>

      {/* ── Gallery ─────────────────────────────── */}
      <main className="rc-gallery-wrap">
        {noCredentials && (
          <div className="rc-notice rc-notice--warn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>Cloudinary credentials not set. Add <code>CLOUDINARY_API_KEY</code> and <code>CLOUDINARY_API_SECRET</code> to your Vercel environment variables, then redeploy.</span>
          </div>
        )}

        {error && !noCredentials && (
          <div className="rc-notice rc-notice--error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <span>
              <strong>Could not load photos.</strong><br/>
              <code style={{fontSize:'0.8em',wordBreak:'break-all'}}>{error}</code><br/><br/>
              If you see <em>404</em> the cloud name is wrong. Find it at{' '}
              <a href="https://cloudinary.com/console" target="_blank" rel="noopener noreferrer" style={{textDecoration:'underline'}}>cloudinary.com/console</a>
              {' '}— it&apos;s shown at the top of your dashboard, or in any image URL after <code>res.cloudinary.com/</code>.
            </span>
          </div>
        )}

        {images.length > 0 && (
          <RunClubGallery images={images} />
        )}

        {images.length === 0 && !noCredentials && !error && (
          <div className="rc-notice rc-notice--warn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>No images found in the <code>run-club</code> Cloudinary folder.</span>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────── */}
      <footer className="footer" style={{ marginTop: '4rem' }}>
        <Image src="/logo.png" alt="Torbay Sharks RFC" width={44} height={44} className="footer-logo-img" />
        <p className="footer-wordmark">SHARKFEST</p>
        <p className="footer-sub">Torbay Sharks RFC · Devon Coast</p>
        <nav className="footer-links">
          <Link href="/">Home</Link>
          <Link href="/#2026">SharkFest 2026</Link>
          <Link href="/#relive">Highlights</Link>
        </nav>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </>
  )
}
