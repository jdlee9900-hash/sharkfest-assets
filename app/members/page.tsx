import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getMembershipOrPartnerMembership, getActiveMembership, reconcileCheckoutSession, membershipNumber, memberDiscountPercent } from '@/lib/membership'
import { thumbUrl } from '@/lib/cloudinary'
import { getOrigin } from '@/lib/email'
import { MembersView, type FeedPost } from '@/components/MembersView'
import { InstallPrompt } from '@/components/InstallPrompt'
import type { MemberPost } from '@/lib/types'
import { adminEmails } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Members · SharkFest',
}

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ welcome?: string; session_id?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/members')

  const { welcome, session_id } = await searchParams

  let membership = await getMembershipOrPartnerMembership(user.id)
  // Just paid but the webhook hasn't landed yet? Reconcile straight from Stripe
  // so a brand-new member isn't bounced back to /join having just subscribed.
  if (!membership && welcome === '1' && session_id) {
    membership = await reconcileCheckoutSession(session_id, user.id)
  }
  if (!membership) redirect('/join')

  const service = createServiceClient()

  // Member name + partner email from their own most recent registration.
  // For partner users, fall back to the booking they share.
  const { data: ownReg } = await service
    .from('registrations')
    .select('first_name, surname, partner_email, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let name = ownReg ? `${ownReg.first_name} ${ownReg.surname}`.trim() : null
  let partnerEmail: string | null = ownReg?.partner_email ?? null
  let isPartner = false

  if (!name) {
    // Partner user — find the booking they were added to.
    const { data: partnerReg } = await service
      .from('registrations')
      .select('partner_email')
      .eq('partner_user_id', user.id)
      .limit(1)
      .maybeSingle()
    name = partnerReg?.partner_email?.split('@')[0] ?? user.email?.split('@')[0] ?? 'Member'
    partnerEmail = null // partners can't manage partner email; that belongs to the primary
    isPartner = true
  }

  // Ensure name is always a string (TypeScript narrowing)
  const displayName: string = name ?? 'Member'

  const hasBooking = isPartner || (!!ownReg && ownReg.status !== 'cancelled')

  const { data: passkeyRows } = await service
    .from('webauthn_credentials')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
  const hasPasskey = (passkeyRows?.length ?? 0) > 0

  // The membership card should always show the primary member's number/plan.
  // For partner users, use getActiveMembership on the primary's user_id.
  const primaryMembership = (await getActiveMembership(user.id)) ?? membership

  const { data: postsData } = await service
    .from('member_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
  const posts = (postsData ?? []) as MemberPost[]

  const toFeed = (p: MemberPost): FeedPost => ({
    id: p.id,
    title: p.title,
    summary: p.summary,
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

  const number = membershipNumber(primaryMembership)
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

  return (
    <>
      <header className="rc-header">
        <Link href="/" className="rc-header-logo" aria-label="Back to SharkFest">
          <Image src="/logo.png" alt="Torbay Sharks RFC" width={36} height={36} />
          <span>SharkFest</span>
        </Link>
        <nav className="rc-header-nav" aria-label="Site navigation">
          <Link href="/my-booking">My booking</Link>
          {adminEmails().includes(user.email ?? '') && (
            <Link href="/admin">Admin</Link>
          )}
        </nav>
      </header>

      <main className="rc-gallery-wrap" style={{ paddingTop: '3rem' }}>
        <MembersView
          card={{
            name: displayName,
            membershipNumber: number,
            plan: primaryMembership.plan,
            status: primaryMembership.status,
            memberSince: primaryMembership.created_at,
            qrDataUrl,
          }}
          email={user.email ?? ''}
          justJoined={welcome === '1'}
          discountPercent={memberDiscountPercent()}
          news={news}
          events={events}
          partnerEmail={partnerEmail}
          isPartner={isPartner}
          isComp={primaryMembership.stripe_subscription_id.startsWith('comp_')}
          isCommunity={primaryMembership.stripe_subscription_id.startsWith('community_')}
          hasBooking={hasBooking}
          hasPasskey={hasPasskey}
        />
      </main>

      <footer className="footer" style={{ marginTop: '4rem' }}>
        <Image src="/logo.png" alt="Torbay Sharks RFC" width={44} height={44} className="footer-logo-img" />
        <p className="footer-wordmark">SHARKFEST</p>
        <p className="footer-sub">Torbay Sharks RFC · Devon Coast</p>
        <nav className="footer-links">
          <Link href="/">Home</Link>
          <Link href="/2027">SharkFest 2027</Link>
        </nav>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>

      <InstallPrompt />
    </>
  )
}
