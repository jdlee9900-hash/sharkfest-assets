import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/membership'
import { adminEmails } from '@/lib/types'
import type { MemberPost, EventRsvp as EventRsvpRow } from '@/lib/types'
import { fullUrl } from '@/lib/cloudinary'
import { EventRsvp } from '@/components/EventRsvp'

export const metadata: Metadata = { title: 'Member event · SharkFest' }
export const dynamic = 'force-dynamic'

function formatRange(start: string | null, end: string | null): string {
  if (!start) return 'Date to be confirmed'
  const s = new Date(start)
  const dateStr = s.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const sTime = s.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (!end) return `${dateStr} · ${sTime}`
  const e = new Date(end)
  const sameDay = s.toDateString() === e.toDateString()
  const eTime = e.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return `${dateStr} · ${sTime}–${eTime}`
  const eDate = e.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  return `${dateStr} ${sTime} → ${eDate} ${eTime}`
}

export default async function MemberEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/members/events/${id}`)

  // Gate to logged-in members; admins may also view (incl. drafts) for previews.
  const isAdmin = adminEmails().includes(user.email ?? '')
  const membership = await getActiveMembership(user.id)
  if (!membership && !isAdmin) redirect('/join')

  const service = createServiceClient()
  const { data } = await service
    .from('member_posts')
    .select('*')
    .eq('id', id)
    .eq('kind', 'event')
    .maybeSingle()

  const event = data as MemberPost | null
  if (!event) notFound()
  // Non-admins can only see published events.
  if (!event.published && !isAdmin) notFound()

  const cover = event.cover_public_id ? fullUrl(event.cover_public_id) : null

  // This member's existing RSVP (if any), so the form opens pre-filled.
  const { data: rsvpData } = membership
    ? await service.from('event_rsvps').select('*').eq('event_id', id).eq('user_id', user.id).maybeSingle()
    : { data: null }
  const rsvp = rsvpData as EventRsvpRow | null

  return (
    <>
      <header className="rc-header">
        <Link href="/" className="rc-header-logo" aria-label="Back to SharkFest">
          <Image src="/logo.png" alt="Torbay Sharks RFC" width={36} height={36} />
          <span>SharkFest</span>
        </Link>
        <nav className="rc-header-nav" aria-label="Site navigation">
          <Link href="/members">Members area</Link>
          <Link href="/">Home</Link>
        </nav>
      </header>

      <main className="event-page">
        <Link href="/members" className="event-back">← Back to members area</Link>

        {!event.published && isAdmin && (
          <div className="mb-banner" role="status" style={{ background: '#fef9c3', color: '#854d0e' }}>
            Draft preview — this event is not yet visible to members.
          </div>
        )}

        <article className="event-article">
          {cover && (
            <div className="event-hero">
              <img src={cover} alt="" />
            </div>
          )}

          <p className="event-eyebrow">Members event</p>
          <h1 className="event-title">{event.title}</h1>

          <div className="event-meta">
            <div className="event-meta-row">
              <span className="event-meta-icon" aria-hidden="true">🗓️</span>
              <span>{formatRange(event.event_at, event.event_end)}</span>
            </div>
            {event.location && (
              <div className="event-meta-row">
                <span className="event-meta-icon" aria-hidden="true">📍</span>
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {event.summary && <p className="event-summary">{event.summary}</p>}

          {event.body && (
            <div className="event-body">
              {event.body.split('\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {membership && event.published && (
            <EventRsvp
              eventId={event.id}
              initial={{
                response: rsvp?.response ?? null,
                adults: rsvp?.adults ?? 1,
                kids: rsvp?.kids ?? 0,
                note: rsvp?.note ?? '',
              }}
            />
          )}

          {isAdmin && !membership && (
            <p className="event-admin-note">RSVP is shown to members here. View responses in the admin members area.</p>
          )}
        </article>
      </main>
    </>
  )
}
