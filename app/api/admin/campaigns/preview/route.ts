import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'
import { buildCampaignPreview } from '@/lib/email'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails().includes(user.email ?? '')) return null
  return user
}

export async function POST(req: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body } = await req.json()
  if (typeof body !== 'string') return NextResponse.json({ error: 'body required' }, { status: 400 })

  return NextResponse.json({ html: buildCampaignPreview(body) })
}
