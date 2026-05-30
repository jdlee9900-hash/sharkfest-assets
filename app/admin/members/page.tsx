import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'
import type { Membership } from '@/lib/types'
import { AdminMemberPosts } from '@/components/AdminMemberPosts'
import { AdminCompMembership } from '@/components/AdminCompMembership'

export const metadata: Metadata = { title: 'Members · Admin · SharkFest' }
export const dynamic = 'force-dynamic'

interface PostRow {
  id: string
  kind: 'news' | 'event'
  title: string
  published: boolean
  created_at: string
  event_at: string | null
  location: string | null
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default async function AdminMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/members')
  if (!adminEmails().includes(user.email ?? '')) redirect('/')

  const service = createServiceClient()
  const [memRes, postRes] = await Promise.all([
    service.from('memberships').select('*').order('created_at', { ascending: false }),
    service.from('member_posts').select('id, kind, title, published, created_at, event_at, location').order('created_at', { ascending: false }).limit(50),
  ])
  const members = (memRes.data ?? []) as Membership[]
  const active = members.filter(m => m.status === 'active' || m.status === 'past_due')
  const posts = (postRes.data ?? []) as PostRow[]
  const newsPosts = posts.filter(p => p.kind === 'news')
  const eventPosts = posts.filter(p => p.kind === 'event')

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
          <AdminMemberPosts kind="news" />
          <div className="mb-card">
            <h3 className="mb-card-title" style={{ marginBottom: '1rem' }}>Published content</h3>
            {newsPosts.length === 0 ? (
              <p style={{ color: 'var(--grey-400)', fontSize: '0.9375rem' }}>No content yet.</p>
            ) : (
              <table className="mb-pay-table">
                <thead><tr><th>Title</th><th>Status</th><th>Created</th></tr></thead>
                <tbody>
                  {newsPosts.map(p => (
                    <tr key={p.id}>
                      <td>{p.title}</td>
                      <td>{p.published ? 'Published' : 'Draft'}</td>
                      <td>{fmtDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* ── Member events ─────────────────────────────────────────────── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 className="mb-title" style={{ fontSize: '1.25rem' }}>Member events</h2>
          <AdminMemberPosts kind="event" />
          <div className="mb-card">
            <h3 className="mb-card-title" style={{ marginBottom: '1rem' }}>Events</h3>
            {eventPosts.length === 0 ? (
              <p style={{ color: 'var(--grey-400)', fontSize: '0.9375rem' }}>No events yet.</p>
            ) : (
              <table className="mb-pay-table">
                <thead><tr><th>Title</th><th>When</th><th>Location</th><th>Status</th><th>Page</th></tr></thead>
                <tbody>
                  {eventPosts.map(p => (
                    <tr key={p.id}>
                      <td>{p.title}</td>
                      <td>{fmtDate(p.event_at)}</td>
                      <td>{p.location ?? '—'}</td>
                      <td>{p.published ? 'Published' : 'Draft'}</td>
                      <td><Link href={`/members/events/${p.id}`} style={{ color: 'var(--gold-600, #b45309)', fontWeight: 600 }}>View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
