import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = { title: 'Unsubscribe · SharkFest' }

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { success, error } = await searchParams
  const isSuccess = success === '1'
  const isInvalid = error === 'invalid' || error === 'missing'

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '24px 16px' }}>
      <div style={{ background: '#ffffff', borderRadius: 12, padding: '40px 32px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28, textDecoration: 'none' }}>
          <Image src="/logo.png" alt="Torbay Sharks RFC" width={28} height={28} />
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>SharkFest</span>
        </Link>

        {isSuccess ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <h1 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
              You&apos;re unsubscribed
            </h1>
            <p style={{ margin: '0 0 24px', fontSize: 15, color: '#64748b', lineHeight: 1.6 }}>
              You&apos;ve been removed from our mailing list and won&apos;t receive future newsletters.
            </p>
          </>
        ) : isInvalid ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✕</div>
            <h1 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
              Link not recognised
            </h1>
            <p style={{ margin: '0 0 24px', fontSize: 15, color: '#64748b', lineHeight: 1.6 }}>
              This unsubscribe link appears to be invalid or has already been used.
              If you&apos;re still receiving emails you don&apos;t want, please contact us directly.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
              Processing…
            </h1>
            <p style={{ color: '#64748b', fontSize: 15 }}>Please wait a moment.</p>
          </>
        )}

        <Link
          href="/"
          style={{ display: 'inline-block', background: '#f1f5f9', color: '#0f172a', fontSize: 14, fontWeight: 600, padding: '10px 20px', borderRadius: 6, textDecoration: 'none', border: '1px solid #e2e8f0' }}
        >
          Back to SharkFest
        </Link>
      </div>
    </main>
  )
}
