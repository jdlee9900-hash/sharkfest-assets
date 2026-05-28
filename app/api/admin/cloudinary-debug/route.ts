import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME ?? 'dtrgis7lb'
const KEY   = process.env.CLOUDINARY_API_KEY    ?? ''
const SEC   = process.env.CLOUDINARY_API_SECRET ?? ''

async function cldGet(path: string, params: Record<string, string> = {}) {
  const auth = Buffer.from(`${KEY}:${SEC}`).toString('base64')
  const qs   = new URLSearchParams(params).toString()
  const res  = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/${path}${qs ? `?${qs}` : ''}`,
    { headers: { Authorization: `Basic ${auth}` }, cache: 'no-store' }
  )
  const text = await res.text()
  try { return { status: res.status, ok: res.ok, data: JSON.parse(text) } }
  catch { return { status: res.status, ok: false, data: text } }
}

async function cldPost(path: string, body: Record<string, unknown>) {
  const auth = Buffer.from(`${KEY}:${SEC}`).toString('base64')
  const res  = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/${path}`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    }
  )
  const text = await res.text()
  try { return { status: res.status, ok: res.ok, data: JSON.parse(text) } }
  catch { return { status: res.status, ok: false, data: text } }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails().includes(user.email!)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!KEY || !SEC) {
    return NextResponse.json({ error: 'CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set' }, { status: 503 })
  }

  const [folders, typeUpload, typePrivate, typeAuthenticated, searchApi] = await Promise.all([
    cldGet('folders'),
    cldGet('resources/image', { type: 'upload',        prefix: 'run-club/', max_results: '5' }),
    cldGet('resources/image', { type: 'private',       prefix: 'run-club/', max_results: '5' }),
    cldGet('resources/image', { type: 'authenticated', prefix: 'run-club/', max_results: '5' }),
    cldPost('resources/search', { expression: 'folder:run-club', max_results: 5 }),
  ])

  return NextResponse.json({
    cloud: CLOUD,
    folders,
    runClub: { typeUpload, typePrivate, typeAuthenticated, searchApi },
  })
}
