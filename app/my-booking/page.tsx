import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { MyBookingView } from '@/components/MyBookingView'

export const metadata: Metadata = {
  title: 'My Booking · SharkFest 2027',
}

export default async function MyBookingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/my-booking')

  const service = createServiceClient()

  // Primary lookup: registration that belongs to this user.
  const { data: primaryReg } = await service
    .from('registrations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Partner fallback: this user was added as a second login on someone else's booking.
  let isPartner = false
  let registration = primaryReg
  if (!registration) {
    const { data: partnerReg } = await service
      .from('registrations')
      .select('*')
      .eq('partner_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (partnerReg) {
      registration = partnerReg
      isPartner = true
    }
  }

  let paymentPlan = null
  let instalments: unknown[] = []
  let payments: unknown[] = []
  let campNearInitial: { id: string; name: string }[] = []

  if (registration) {
    const [ppRes, insRes, payRes] = await Promise.all([
      service.from('payment_plans').select('*').eq('registration_id', registration.id).maybeSingle(),
      service.from('instalments').select('*').eq('registration_id', registration.id).order('due_date', { ascending: true, nullsFirst: false }),
      service.from('payments').select('*').eq('registration_id', registration.id).order('created_at', { ascending: false }),
    ])
    paymentPlan = ppRes.data
    instalments = insRes.data ?? []
    payments = payRes.data ?? []

    // Resolve the registrant's current "camp near" people to display names.
    const nearIds = [registration.camp_near_1, registration.camp_near_2].filter(Boolean) as string[]
    if (nearIds.length > 0) {
      const { data: people } = await service
        .from('registrations')
        .select('id, first_name, surname')
        .in('id', nearIds)
      campNearInitial = nearIds
        .map(id => {
          const p = people?.find(x => x.id === id)
          return p ? { id, name: `${p.first_name} ${p.surname}`.trim() } : null
        })
        .filter((x): x is { id: string; name: string } => x !== null)
    }
  }

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
          <Link href="/members">Members</Link>
        </nav>
      </header>

      <main className="rc-gallery-wrap" style={{ paddingTop: '3rem' }}>
        <Suspense fallback={null}>
          <MyBookingView
            user={{ email: user.email ?? '' }}
            registration={registration}
            paymentPlan={paymentPlan}
            instalments={instalments as never[]}
            payments={payments as never[]}
            campNearInitial={campNearInitial}
            isPartner={isPartner}
          />
        </Suspense>
      </main>

      <footer className="footer" style={{ marginTop: '4rem' }}>
        <Image src="/logo.png" alt="Torbay Sharks RFC" width={44} height={44} className="footer-logo-img" />
        <p className="footer-wordmark">SHARKFEST</p>
        <p className="footer-sub">Torbay Sharks RFC · Devon Coast</p>
        <nav className="footer-links">
          <Link href="/">Home</Link>
          <Link href="/members">Members area</Link>
        </nav>
        <p className="footer-copy">© 2026 Torbay Sharks RFC. All rights reserved.</p>
      </footer>
    </>
  )
}
