import { NextResponse } from 'next/server'
import crypto from 'crypto'

const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? ''
const API_KEY    = process.env.CLOUDINARY_API_KEY    ?? ''
const CLOUD      = process.env.CLOUDINARY_CLOUD_NAME ?? 'dtrgis7lb'

export async function POST(req: Request) {
  if (!API_SECRET || !API_KEY) {
    return NextResponse.json({ error: 'Upload not configured' }, { status: 503 })
  }

  let body: { uploaderName?: string; photoTakenAt?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const rawName = (body.uploaderName ?? '').trim()
  if (!rawName) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // Sanitise: strip Cloudinary context delimiters from user input
  const safeName = rawName.replace(/[|=\n\r]/g, ' ').slice(0, 80)
  const safeDate = (body.photoTakenAt ?? '').replace(/[|=\n\r]/g, '')

  const timestamp = Math.floor(Date.now() / 1000)
  const folder    = 'public-uploads'
  const context   = `uploader_name=${safeName}|photo_taken_at=${safeDate}`

  // Cloudinary signature: sorted params joined with &, then append secret
  const paramStr = [`context=${context}`, `folder=${folder}`, `timestamp=${timestamp}`]
    .sort()
    .join('&')

  const signature = crypto
    .createHash('sha256')
    .update(paramStr + API_SECRET)
    .digest('hex')

  return NextResponse.json({ timestamp, signature, apiKey: API_KEY, cloudName: CLOUD, folder, context })
}
