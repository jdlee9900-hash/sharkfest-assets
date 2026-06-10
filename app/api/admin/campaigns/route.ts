import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/admin'

export async function GET() {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaigns: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject, body } = await req.json()
  if (!subject?.trim()) return NextResponse.json({ error: 'subject required' }, { status: 400 })
  if (subject.length > 200) return NextResponse.json({ error: 'subject too long (max 200 characters)' }, { status: 400 })
  if (body && body.length > 200_000) return NextResponse.json({ error: 'body too long (max 200,000 characters)' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('email_campaigns')
    .insert({ subject: subject.trim(), body: body ?? '' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaign: data })
}
