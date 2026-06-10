import { type NextRequest, NextResponse } from 'next/server'
import { } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/admin'
import { buildCampaignPreview } from '@/lib/email'

export async function POST(req: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body } = await req.json()
  if (typeof body !== 'string') return NextResponse.json({ error: 'body required' }, { status: 400 })

  return NextResponse.json({ html: buildCampaignPreview(body) })
}
