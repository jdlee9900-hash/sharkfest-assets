import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from '@/components/LoginForm'

export const metadata: Metadata = {
  title: 'Sign in · SharkFest 2027',
}

export default function LoginPage() {
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
          <Link href="/join" className="btn btn-accent" style={{ fontSize: '0.8125rem', height: '2.25rem', padding: '0 1.125rem' }}>
            Become a member
          </Link>
        </nav>
      </header>

      <main className="auth-wrap">
        <Suspense fallback={<div className="auth-card" style={{ minHeight: 260 }} />}>
          <LoginForm />
        </Suspense>
      </main>

      <footer className="footer" style={{ marginTop: '4rem' }}>
        <p className="footer-sub">Torbay Sharks RFC · Devon Coast</p>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </>
  )
}
