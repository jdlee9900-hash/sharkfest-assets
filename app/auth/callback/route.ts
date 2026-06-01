import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/my-booking'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user?.email) {
      const service = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      // Link any registrations with this email that aren't yet tied to a user account.
      await service
        .from('registrations')
        .update({ user_id: user.id })
        .eq('email', user.email)
        .is('user_id', null)

      // Stamp partner_user_id when a partner first logs in — lets them access
      // the shared booking going forward without needing the email match each time.
      await service
        .from('registrations')
        .update({ partner_user_id: user.id })
        .ilike('partner_email', user.email)
        .is('partner_user_id', null)

      // Keep the member flag on this user's registrations in sync with their
      // current membership, so member pricing applies when a plan is allocated.
      const { isActiveMember } = await import('@/lib/membership')
      const member = await isActiveMember(user.id)
      await service.from('registrations').update({ is_member: member }).eq('user_id', user.id)
    }

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
