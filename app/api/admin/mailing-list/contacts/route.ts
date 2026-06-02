import { type NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails().includes(user.email ?? '')) return null
  return user
}

export async function GET() {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('mailing_list_contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const contacts = data ?? []
  return NextResponse.json({
    contacts,
    stats: {
      total: contacts.length,
      active: contacts.filter((c: { unsubscribed: boolean }) => !c.unsubscribed).length,
      unsubscribed: contacts.filter((c: { unsubscribed: boolean }) => c.unsubscribed).length,
    },
  })
}

export async function POST(req: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { email, first_name = '', last_name = '' } = body
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('mailing_list_contacts')
    .insert({ email: email.trim().toLowerCase(), first_name, last_name, source: 'manual' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contact: data })
}
