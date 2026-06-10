'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Header CTA for statically-cached pages (community, run-club) that can't do a
// server-side auth check without opting out of ISR. Resolves auth in the browser
// and only shows "Become a member" to logged-out visitors. Renders nothing until
// auth is known so signed-in users never see a flash of the button.
export function HeaderMemberCta() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    import('@/lib/supabase/client').then(({ createClient }) =>
      createClient().auth.getUser().then(({ data }) => {
        if (active) setLoggedIn(!!data.user)
      })
    )
    return () => { active = false }
  }, [])

  if (loggedIn !== false) return null

  return (
    <Link href="/join" className="btn btn-accent" style={{ fontSize: '0.8125rem', height: '2.25rem', padding: '0 1.125rem' }}>
      Become a member
    </Link>
  )
}
