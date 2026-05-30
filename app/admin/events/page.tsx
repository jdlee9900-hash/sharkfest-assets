import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'
import type { MemberPost, EventRsvp } from '@/lib/types'
import { AdminMemberContent } from '@/components/AdminMemberContent'
import { AdminEventRsvps } from '@/components/AdminEventRsvps'

export const metadata: Metadata = { title: 'Events · Admin · SharkFest' }
export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/events')
  if (!adminEmails().includes(user.email ?? '')) redirect('/')

  const service = createServiceClient()
  const [postRes, rsvpRes] = await Promise.all([
    service.from('member_posts').select('*').order('created_at', { ascending: false }).limit(100),
    service.from('event_rsvps').select('*').order('updated_at', { ascending: false }),
  ])
  const posts = (postRes.data ?? []) as MemberPost[]
  const newsPosts = posts.filter(p => p.kind === 'news')
  const eventPosts = posts.filter(p => p.kind === 'event')

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
          <Link href="/admin/members">Members</Link>
          <Link href="/">Home</Link>
        </nav>
      </header>

      <main style={{ padding: '2rem 1rem 4rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h1 className="mb-title">Events</h1>
          <p className="mb-email">{eventPosts.length} event{eventPosts.length !== 1 ? 's' : ''} · {newsPosts.length} news post{newsPosts.length !== 1 ? 's' : ''}</p>
        </div>

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
      </main>
    </>
  )
}
