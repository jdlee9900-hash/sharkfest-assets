import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'
import { getPricing, savePricing } from '@/lib/pricing-server'

async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (!adminEmails().includes(user.email ?? '')) return null
  return user.email ?? 'admin'
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getPricing())
}

export async function PUT(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid pricing payload' }, { status: 400 })
  }

  // savePricing merges over defaults and clamps every value, so partial or
  // malformed input can never corrupt the stored blob.
  const saved = await savePricing(body, admin)
  return NextResponse.json(saved)
}
