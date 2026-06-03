import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership, createCommunityMembership } from '@/lib/membership'
import { sendEmail, emailMembershipWelcome, getOrigin } from '@/lib/email'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const existing = await getActiveMembership(user.id)
  if (existing) return NextResponse.json({ error: 'You already have an active membership' }, { status: 409 })

  try {
    await createCommunityMembership(user.id, user.email ?? '')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not create membership'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Send welcome email best-effort — don't fail the request if email is down
  try {
    const firstName = user.email?.split('@')[0] ?? 'there'
    await sendEmail(
      user.email ?? '',
      'Welcome to Torbay Sharks RFC',
      emailMembershipWelcome({ first_name: firstName }, 'community', getOrigin()),
    )
  } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true })
}
