import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { rateLimit, clientIp } from '@/lib/rate-limit'

const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? ''
const API_KEY    = process.env.CLOUDINARY_API_KEY    ?? ''
const CLOUD      = process.env.CLOUDINARY_CLOUD_NAME ?? ''

// Restrict signed uploads to real image formats — the signature covers this
// param, so Cloudinary will reject anything else (executables, video, etc.).
const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,gif,heic,heif'

export async function POST(req: Request) {
  if (!API_SECRET || !API_KEY || !CLOUD) {
    return NextResponse.json({ error: 'Upload not configured' }, { status: 503 })
  }

  // Throttle token minting: this endpoint is public, so cap how fast any one
  // client can request signed upload tokens (one token == one file upload).
  const limit = rateLimit(`sign-upload:${clientIp(req)}`, 60, 10 * 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many uploads — please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  let body: { uploaderName?: string; photoTakenAt?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Cap length before any processing, then strip Cloudinary context delimiters.
  const rawName = (body.uploaderName ?? '').slice(0, 200).trim()
  if (!rawName) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  const safeName = rawName.replace(/[|=\n\r]/g, ' ').slice(0, 80)
  const safeDate = (body.photoTakenAt ?? '').slice(0, 40).replace(/[|=\n\r]/g, '')

  const timestamp = Math.floor(Date.now() / 1000)
  const folder    = 'public-uploads'
  const context   = `uploader_name=${safeName}|photo_taken_at=${safeDate}`

  // Cloudinary signature: signed params sorted, joined with &, then secret appended.
  const paramStr = [
    `allowed_formats=${ALLOWED_FORMATS}`,
    `context=${context}`,
    `folder=${folder}`,
    `timestamp=${timestamp}`,
  ]
    .sort()
    .join('&')

  const signature = crypto
    .createHash('sha256')
    .update(paramStr + API_SECRET)
    .digest('hex')

  return NextResponse.json({
    timestamp,
    signature,
    apiKey: API_KEY,
    cloudName: CLOUD,
    folder,
    context,
    allowedFormats: ALLOWED_FORMATS,
  })
}
