import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'
import type { Membership, MemberPost, EventRsvp } from '@/lib/types'
import { AdminMemberContent } from '@/components/AdminMemberContent'
import { AdminCompMembership } from '@/components/AdminCompMembership'
import { AdminEventRsvps } from '@/components/AdminEventRsvps'

export const metadata: Metadata = { title: 'Members · Admin · SharkFest' }
export const dynamic = 'force-dynamic'

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default async function AdminMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/members')
  if (!adminEmails().includes(user.email ?? '')) redirect('/')

  const service = createServiceClient()
  const [memRes, postRes, rsvpRes] = await Promise.all([
    service.from('memberships').select('*').order('created_at', { ascending: false }),
    service.from('member_posts').select('*').order('created_at', { ascending: false }).limit(100),
    service.from('event_rsvps').select('*').order('updated_at', { ascending: false }),
  ])
  const members = (memRes.data ?? []) as Membership[]
  const active = members.filter(m => m.status === 'active' || m.status === 'past_due')
  const posts = (postRes.data ?? []) as MemberPost[]
  const newsPosts = posts.filter(p => p.kind === 'news')
  const eventPosts = posts.filter(p => p.kind === 'event')

  // Group RSVPs by event so each event shows its own interest list.
  const rsvps = (rsvpRes.data ?? []) as EventRsvp[]
  const rsvpsByEvent = new Map<string, EventRsvp[]>()
  for (const r of rsvps) {
    const arr = rsvpsByEvent.get(r.event_id) ?? []
    arr.push(r)
    rsvpsByEvent.set(r.event_id, arr)
  }

  return (
    <>
      <header className="rc-header">
        <Link href="/" className="rc-header-logo" aria-label="Back to SharkFest">
          <Image src="/logo.png" alt="Torbay Sharks RFC" width={36} height={36} />
          <span>SharkFest</span>
        </Link>
        <nav className="rc-header-nav" aria-label="Site navigation">
          <Link href="/admin">Registrations</Link>
          <Link href="/">Home</Link>
        </nav>
      </header>

      <main style={{ padding: '2rem 1rem 4rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h1 className="mb-title">Members</h1>
          <p className="mb-email">{active.length} active · {members.length} total</p>
        </div>

        <AdminCompMembership />

        {/* ── Exclusive content ─────────────────────────────────────────── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 className="mb-title" style={{ fontSize: '1.25rem' }}>Exclusive content</h2>
          <AdminMemberContent kind="news" posts={newsPosts} />
        </section>

        {/* ── Member events ─────────────────────────────────────────────── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 className="mb-title" style={{ fontSize: '1.25rem' }}>Member events</h2>
          <AdminMemberContent kind="event" posts={eventPosts} />

          {eventPosts.length > 0 && (
            <div className="mb-card">
              <h3 className="mb-card-title" style={{ marginBottom: '1rem' }}>Who&apos;s interested</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {eventPosts.map(p => (
                  <AdminEventRsvps key={p.id} title={p.title} rsvps={rsvpsByEvent.get(p.id) ?? []} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Member list ───────────────────────────────────────────────── */}
        <div className="mb-card">
          <h2 className="mb-card-title" style={{ marginBottom: '1rem' }}>Member list</h2>
          {members.length === 0 ? (
            <p style={{ color: 'var(--grey-400)', fontSize: '0.9375rem' }}>No members yet.</p>
          ) : (
            <table className="mb-pay-table">
              <thead><tr><th>Email</th><th>Plan</th><th>Status</th><th>Renews</th></tr></thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>{m.email}</td>
                    <td style={{ textTransform: 'capitalize' }}>{m.plan}{m.stripe_customer_id === 'comp' ? ' · comp' : ''}</td>
                    <td style={{ textTransform: 'capitalize' }}>{m.status.replace('_', ' ')}</td>
                    <td>{fmtDate(m.current_period_end)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  )
}
