const CLOUD = process.env.CLOUDINARY_CLOUD_NAME ?? 'dtrgis7lb'
const KEY   = process.env.CLOUDINARY_API_KEY    ?? ''
const SEC   = process.env.CLOUDINARY_API_SECRET ?? ''

export interface CloudinaryAsset {
  public_id: string
  width?: number
  height?: number
  format: string
  created_at: string
  image_metadata?: Record<string, string>
}

export interface CommunityAsset extends CloudinaryAsset {
  context?: {
    custom?: {
      uploader_name?: string
      photo_taken_at?: string
    }
  }
}

export function thumbUrl(publicId: string, w = 700) {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/w_${w},c_limit,f_auto,q_auto/${publicId}`
}

export function fullUrl(publicId: string) {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/w_1920,c_limit,f_auto,q_auto/${publicId}`
}

/**
 * Extracts a Date from common Android camera filename patterns.
 * iOS uses sequential IMG_XXXX filenames with no date embedded.
 */
function parseAndroidFilename(name: string): Date | null {
  const patterns: RegExp[] = [
    /^(?:PXL|IMG)_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/,
    /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/,
    /^IMG-(\d{4})(\d{2})(\d{2})/,
  ]
  for (const re of patterns) {
    const m = name.match(re)
    if (!m) continue
    const iso = m[4]
      ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`
      : `${m[1]}-${m[2]}-${m[3]}T00:00:00`
    const d = new Date(iso)
    if (!isNaN(d.getTime())) return d
  }
  return null
}

/**
 * Best-effort date the photo was taken.
 * Priority: EXIF → Android filename → context metadata → upload date.
 */
export function photoTakenAt(asset: CloudinaryAsset & { context?: { custom?: { photo_taken_at?: string } } }): Date {
  const exif = asset.image_metadata?.DateTimeOriginal ?? asset.image_metadata?.DateTime
  if (exif) {
    const iso = exif.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
    const d = new Date(iso)
    if (!isNaN(d.getTime())) return d
  }

  const filename = asset.public_id.split('/').pop() ?? ''
  const androidDate = parseAndroidFilename(filename)
  if (androidDate) return androidDate

  const ctx = asset.context?.custom?.photo_taken_at
  if (ctx) {
    const d = new Date(ctx)
    if (!isNaN(d.getTime())) return d
  }

  return new Date(asset.created_at)
}

async function apiGet(path: string, params: Record<string, string> = {}) {
  const auth = Buffer.from(`${KEY}:${SEC}`).toString('base64')
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/${path}${qs ? `?${qs}` : ''}`,
    { headers: { Authorization: `Basic ${auth}` }, next: { revalidate: 3600 } }
  )
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Cloudinary ${res.status} on /${path} — ${body}`)
  }
  return res.json()
}

async function fetchPage(params: Record<string, string>): Promise<{ resources: CloudinaryAsset[]; next_cursor?: string }> {
  return apiGet('resources/image', params)
}

async function collectPages<T extends CloudinaryAsset>(params: Record<string, string>): Promise<T[]> {
  const all: T[] = []
  let nextCursor: string | undefined
  do {
    const p = { ...params, ...(nextCursor ? { next_cursor: nextCursor } : {}) }
    const data = await fetchPage(p)
    all.push(...(data.resources as T[]))
    nextCursor = data.next_cursor
  } while (nextCursor)
  return all.sort((a, b) => photoTakenAt(a).getTime() - photoTakenAt(b).getTime())
}

/**
 * Fetch all images from a Cloudinary folder.
 * Uses prefix-based queries (works for fixed/legacy folder mode).
 * Pass { context: true } to include uploader metadata (for public-uploads).
 */
export async function getFolder(folder: string, opts: { context?: boolean } = {}): Promise<CloudinaryAsset[]> {
  if (!KEY || !SEC) return []

  const base: Record<string, string> = {
    type: 'upload',
    max_results: '500',
    image_metadata: 'true',
    ...(opts.context ? { context: 'true' } : {}),
  }

  // Try with trailing slash first — matches exactly this folder
  try {
    const r = await collectPages<CloudinaryAsset>({ ...base, prefix: `${folder}/` })
    if (r.length > 0) return r
  } catch { /* try next */ }

  // Fallback without trailing slash
  try {
    return await collectPages<CloudinaryAsset>({ ...base, prefix: folder })
  } catch { return [] }
}
