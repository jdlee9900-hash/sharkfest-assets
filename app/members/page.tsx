import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getActiveMembership, membershipNumber, memberDiscountPercent } from '@/lib/membership'
import { thumbUrl } from '@/lib/cloudinary'
import { getOrigin } from '@/lib/email'
import { MembersView, type FeedPost } from '@/components/MembersView'
import type { MemberPost } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Members · SharkFest',
}

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/members')

  const membership = await getActiveMembership(user.id)
  if (!membership) redirect('/join')

  const service = createServiceClient()

  // Member name from their most recent registration, else the email local-part.
  const { data: reg } = await service
    .from('registrations')
    .select('first_name, surname')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const name = reg ? `${reg.first_name} ${reg.surname}`.trim() : (user.email?.split('@')[0] ?? 'Member')

  const { data: postsData } = await service
    .from('member_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
  const posts = (postsData ?? []) as MemberPost[]

  const toFeed = (p: MemberPost): FeedPost => ({
    id: p.id,
    title: p.title,
    body: p.body,
    coverUrl: p.cover_public_id ? thumbUrl(p.cover_public_id, 800) : null,
    event_at: p.event_at,
    location: p.location,
  })
  const news = posts.filter(p => p.kind === 'news').map(toFeed)
  const events = posts
    .filter(p => p.kind === 'event')
    .sort((a, b) => (a.event_at ?? '').localeCompare(b.event_at ?? ''))
    .map(toFeed)

  const number = membershipNumber(membership)
  let qrDataUrl: string | null = null
  try {
    qrDataUrl = await QRCode.toDataURL(`${getOrigin()}/members?verify=${number}`, {
      margin: 1,
      width: 184,
      color: { dark: '#0a0f1e', light: '#ffffff' },
    })
  } catch {
    qrDataUrl = null
  }

  const { welcome } = await searchParams

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
          <Link href="/my-booking">My booking</Link>
        </nav>
      </header>

      <main className="rc-gallery-wrap" style={{ paddingTop: '3rem' }}>
        <MembersView
          card={{
            name,
            membershipNumber: number,
            plan: membership.plan,
            status: membership.status,
            memberSince: membership.created_at,
            qrDataUrl,
          }}
          email={user.email ?? ''}
          justJoined={welcome === '1'}
          discountPercent={memberDiscountPercent()}
          news={news}
          events={events}
        />
      </main>

      <footer className="footer" style={{ marginTop: '4rem' }}>
        <Image src="/logo.png" alt="Torbay Sharks RFC" width={44} height={44} className="footer-logo-img" />
        <p className="footer-wordmark">SHARKFEST</p>
        <p className="footer-sub">Torbay Sharks RFC · Devon Coast</p>
        <nav className="footer-links">
          <Link href="/">Home</Link>
          <Link href="/register">Register 2028</Link>
        </nav>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </>
  )
}
