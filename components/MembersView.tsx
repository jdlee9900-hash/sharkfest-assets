'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MembershipCard } from '@/components/MembershipCard'
import { Countdown2027 } from '@/components/Countdown2027'

function redirectToStripe(url: unknown) {
  if (typeof url !== 'string') throw new Error('Could not open billing')
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' || !/(^|\.)stripe\.com$/.test(parsed.hostname)) {
    throw new Error('Could not open billing')
  }
  window.location.href = url
}

export interface FeedPost {
  id: string
  title: string
  summary: string | null
  body: string
  coverUrl: string | null
  event_at: string | null
  location: string | null
}

interface Props {
  card: {
    name: string
    membershipNumber: string
    plan: 'monthly' | 'annual'
    status: string
    memberSince: string | null
    qrDataUrl: string | null
  }
  email: string
  justJoined: boolean
  discountPercent: number
  news: FeedPost[]
  events: FeedPost[]
}

const BENEFITS = (discountPercent: number) => [
  { icon: '🎟️', title: 'Member ticket price', body: `Save ${discountPercent}% on your SharkFest 2027 pitch — applied automatically to your booking.` },
  { icon: '📸', title: 'Exclusive content', body: 'Behind-the-scenes stories, photos and updates between festivals.' },
  { icon: '🎉', title: 'Members events', body: 'Invitations to socials and gatherings through the year.' },
  { icon: '🦈', title: 'Support the club', body: 'Every membership helps Torbay Sharks RFC keep SharkFest going.' },
]

const F27_HIGHLIGHTS = [
  { icon: '🎸', day: 'Fri', label: 'Indie covers band' },
  { icon: '🪩', day: 'Sat', label: '25th party · silver theme' },
  { icon: '🤠', day: 'Sun', label: 'Line dancing & country band' },
]

export function MembersView({ card, email, justJoined, discountPercent, news, events }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleManage = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/membership/portal', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Could not open billing')
      redirectToStripe(body.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setBusy(false)
    }
  }

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    await createClient().auth.signOut()
    router.push('/')
  }

  return (
    <div className="members-wrap">
      <div className="members-head">
        <div>
          <p className="members-eyebrow">Members area</p>
          <h1 className="members-title">Welcome back{card.name ? `, ${card.name.split(' ')[0]}` : ''}</h1>
          <p className="members-email">{email}</p>
        </div>
        <button className="mb-signout" onClick={handleSignOut}>Log out</button>
      </div>

      {justJoined && (
        <div className="mb-banner mb-banner--success" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          You&apos;re in — welcome to the club!
        </div>
      )}

      {/* ✦ SharkFest 2027 — members-exclusive showcase ✦ */}
      <section className="m27 f27" aria-label="SharkFest 2027 — members exclusive">
        <div className="f27-sparkles m27-sparkles" aria-hidden="true" />
        <div className="m27-glow" aria-hidden="true" />

        <div className="m27-inner">
          <span className="m27-badge">✦ Members Exclusive</span>

          <p className="m27-eyebrow">The Silver 25th Anniversary</p>
          <h2 className="m27-title">SharkFest 2027</h2>
          <p className="m27-dates">28–31 May 2027 · May Bank Holiday Weekend</p>

          <p className="m27-lead">
            Twenty-five years of SharkFest, celebrated in glistening silver — and your
            membership is your key to the gate. Registration is exclusive to members.
          </p>

          <Countdown2027 />

          <ul className="m27-highlights">
            {F27_HIGHLIGHTS.map(h => (
              <li className="m27-highlight" key={h.day}>
                <span className="m27-highlight-icon" aria-hidden="true">{h.icon}</span>
                <span className="m27-highlight-day">{h.day}</span>
                <span className="m27-highlight-label">{h.label}</span>
              </li>
            ))}
          </ul>

          <div className="m27-cta">
            <Link href="/register?year=2027" className="f27-btn f27-btn--silver f27-btn--lg">
              Register your pitch
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/2027" className="f27-btn f27-btn--ghost">Explore the weekend</Link>
          </div>

          <p className="m27-note">Your member ticket discount is applied automatically when we set up your booking.</p>
        </div>
      </section>

      {/* Membership card centrepiece */}
      <div className="members-card-stage">
        <MembershipCard {...card} />
        <div className="members-card-side">
          <p className="members-side-note">
            Your digital membership card. Show the QR code at member events to verify your membership.
          </p>
          {error && (
            <div className="auth-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          <button className="btn btn-dark members-manage" onClick={handleManage} disabled={busy}>
            {busy ? 'Opening…' : 'Manage membership & billing'}
          </button>
        </div>
      </div>

      {/* Benefits */}
      <div className="members-benefits">
        {BENEFITS(discountPercent).map(b => (
          <div className="members-benefit" key={b.title}>
            <span className="members-benefit-icon" aria-hidden="true">{b.icon}</span>
            <p className="members-benefit-title">{b.title}</p>
            <p className="members-benefit-body">{b.body}</p>
          </div>
        ))}
      </div>

      {/* Exclusive content */}
      <section className="members-section">
        <h2 className="members-section-title">Exclusive content</h2>
        {news.length === 0 ? (
          <p className="members-empty">No posts yet — check back soon for members-only updates.</p>
        ) : (
          <div className="members-feed">
            {news.map(p => (
              <article className="members-post" key={p.id}>
                {p.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="members-post-cover" src={p.coverUrl} alt="" loading="lazy" />
                )}
                <div className="members-post-body">
                  <h3 className="members-post-title">{p.title}</h3>
                  {p.body && <p className="members-post-text">{p.body}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Members events */}
      <section className="members-section">
        <h2 className="members-section-title">Members events</h2>
        {events.length === 0 ? (
          <p className="members-empty">No upcoming events right now — we&apos;ll post them here.</p>
        ) : (
          <div className="members-events">
            {events.map(e => (
              <Link href={`/members/events/${e.id}`} className="members-event" key={e.id}>
                <div className="members-event-date" aria-hidden="true">
                  {e.event_at
                    ? new Date(e.event_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                    : 'TBC'}
                </div>
                <div>
                  <h3 className="members-event-title">{e.title}</h3>
                  <p className="members-event-meta">
                    {e.event_at && new Date(e.event_at).toLocaleString('en-GB', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                    {e.location ? ` · ${e.location}` : ''}
                  </p>
                  {(e.summary ?? e.body) && <p className="members-event-text">{e.summary ?? e.body}</p>}
                </div>
                <span className="members-event-go" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
