import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getFolder } from '@/lib/cloudinary'
import type { CommunityAsset, CloudinaryAsset } from '@/lib/cloudinary'
import { CommunityUpload }  from '@/components/CommunityUpload'
import { CommunityGallery } from '@/components/CommunityGallery'
import { HeaderMemberCta }  from '@/components/HeaderMemberCta'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Community Photos · SharkFest 2026',
  description: 'Share your photos from SharkFest 2026 — Torbay Sharks RFC, Devon Coast.',
}

export default async function CommunityPage() {
  let photos:        CommunityAsset[]    = []
  let runClubPhotos: CloudinaryAsset[]   = []

  await Promise.allSettled([
    getFolder('public-uploads', { context: true }).then(r => { photos = r as CommunityAsset[] }),
    getFolder('run-club').then(r => { runClubPhotos = r }),
  ])

  const noCredentials = !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET

  return (
    <>
      {/* ── Header ──────────────────────────────── */}
      <header className="rc-header">
        <Link href="/" className="rc-header-logo" aria-label="Back to SharkFest">
          <Image src="/logo.png" alt="Torbay Sharks RFC" width={36} height={36} />
          <span>SharkFest</span>
        </Link>
        <nav className="rc-header-nav" aria-label="Site navigation">
          <Link href="/run-club">Run Club</Link>
          <HeaderMemberCta />
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
          <h1 className="rc-hero-title">Community</h1>
          <p className="rc-hero-sub">
            {photos.length > 0
              ? `${photos.length} photos shared · ${runClubPhotos.length} run club shots — sorted by day and time.`
              : 'Share your shots from the weekend — the good, the muddy, the golden.'}
          </p>
        </div>
        <div className="hero-wave" style={{ zIndex: 2 }} aria-hidden="true">
          <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,24 C360,48 720,0 1080,24 C1260,36 1380,12 1440,24 L1440,48 L0,48 Z" fill="var(--off-white)"/>
          </svg>
        </div>
      </section>

      {/* ── Main ────────────────────────────────── */}
      <main className="rc-gallery-wrap" style={{ paddingTop: '3rem' }}>

        {noCredentials && (
          <div className="rc-notice rc-notice--warn" style={{ marginBottom: '2rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>Cloudinary credentials not set — uploads and the gallery will not work until <code>CLOUDINARY_API_KEY</code> and <code>CLOUDINARY_API_SECRET</code> are added to Vercel.</span>
          </div>
        )}

        {/* Upload card */}
        <CommunityUpload />

        {/* Divider */}
        {photos.length > 0 && (
          <div className="cg-divider">
            <span className="cg-divider-line" />
            <span className="cg-divider-text">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} shared so far
            </span>
            <span className="cg-divider-line" />
          </div>
        )}

        {/* Gallery */}
        {(photos.length > 0 || runClubPhotos.length > 0) && (
          <CommunityGallery photos={photos} runClubPhotos={runClubPhotos} />
        )}

        {photos.length === 0 && !noCredentials && (
          <div className="cg-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <p>No photos yet — be the first to share yours.</p>
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
          <Link href="/run-club">Run Club</Link>
        </nav>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </>
  )
}
