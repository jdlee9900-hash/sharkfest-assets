import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const origin = req.nextUrl.origin

  if (!token) {
    return NextResponse.redirect(new URL('/unsubscribe?error=missing', origin))
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('mailing_list_contacts')
    .update({ unsubscribed: true })
    .eq('unsubscribe_token', token)
    .select('email')
    .single()

  if (error || !data) {
    return NextResponse.redirect(new URL('/unsubscribe?error=invalid', origin))
  }

  return NextResponse.redirect(new URL('/unsubscribe?success=1', origin))
}
