import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { linkUserToAccount } from '@/lib/auth-linking'

/**
 * Run the post-sign-in account linking after a successful OTP code
 * verification. The browser client persists the session to cookies when
 * `verifyOtp` resolves, so the server client here can read the authenticated
 * user and run the same linking the magic-link callback does.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  await linkUserToAccount(user.id, user.email)

  return NextResponse.json({ ok: true })
}
