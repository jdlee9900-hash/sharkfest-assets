import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'

const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? ''
const API_KEY    = process.env.CLOUDINARY_API_KEY    ?? ''
const CLOUD      = process.env.CLOUDINARY_CLOUD_NAME ?? ''

const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,gif,heic,heif'

/**
 * Mints a signed Cloudinary upload token for admins to attach images to member
 * content/events. Mirrors /api/sign-upload, but admin-gated and writes to the
 * `members` folder (instead of public-uploads).
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails().includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!API_SECRET || !API_KEY || !CLOUD) {
    return NextResponse.json({ error: 'Upload not configured' }, { status: 503 })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder    = 'members'

  // Signed params sorted, joined with &, secret appended (Cloudinary convention).
  const paramStr = [
    `allowed_formats=${ALLOWED_FORMATS}`,
    `folder=${folder}`,
    `timestamp=${timestamp}`,
  ].sort().join('&')

  const signature = crypto.createHash('sha256').update(paramStr + API_SECRET).digest('hex')

  return NextResponse.json({
    timestamp,
    signature,
    apiKey: API_KEY,
    cloudName: CLOUD,
    folder,
    allowedFormats: ALLOWED_FORMATS,
  })
}
