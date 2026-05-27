const CLOUD = process.env.CLOUDINARY_CLOUD_NAME ?? 'dtrgis7lb'
const KEY   = process.env.CLOUDINARY_API_KEY    ?? ''
const SEC   = process.env.CLOUDINARY_API_SECRET ?? ''

export interface CloudinaryAsset {
  public_id: string
  width: number
  height: number
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
 *
 * Patterns handled:
 *   PXL_YYYYMMDD_HHMMSS*   — Google Pixel
 *   YYYYMMDD_HHMMSS*       — Samsung, LG, stock Android
 *   IMG_YYYYMMDD_HHMMSS*   — Huawei, OnePlus, Xiaomi
 *   IMG-YYYYMMDD-WA*       — WhatsApp saves (date only, time set to 00:00)
 */
function parseAndroidFilename(name: string): Date | null {
  const patterns: RegExp[] = [
    /^(?:PXL|IMG)_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/,  // PXL_ / IMG_YYYYMMDD_HHMMSS
    /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/,               // YYYYMMDD_HHMMSS
    /^IMG-(\d{4})(\d{2})(\d{2})/,                                   // WhatsApp IMG-YYYYMMDD (date only)
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
 * Returns the best-effort date the photo was actually taken.
 * Priority: Cloudinary EXIF → PXL_ filename → context metadata → created_at.
 */
export function photoTakenAt(asset: CloudinaryAsset & { context?: { custom?: { photo_taken_at?: string } } }): Date {
  // 1. Cloudinary EXIF (image_metadata requested via API)
  const exif = asset.image_metadata?.DateTimeOriginal ?? asset.image_metadata?.DateTime
  if (exif) {
    // EXIF format: "2026:05:24 09:42:19" — replace first two colons only
    const iso = exif.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
    const d = new Date(iso)
    if (!isNaN(d.getTime())) return d
  }

  // 2. Parse date/time from Android camera filename patterns
  //    iOS uses sequential IMG_XXXX with no date — EXIF above is the only option there.
  const filename = asset.public_id.split('/').pop() ?? ''
  const androidDate = parseAndroidFilename(filename)
  if (androidDate) return androidDate

  // 3. Context metadata (set by community upload form)
  const ctx = asset.context?.custom?.photo_taken_at
  if (ctx) {
    const d = new Date(ctx)
    if (!isNaN(d.getTime())) return d
  }

  // 4. Cloudinary upload date
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

/** List all root-level folder names in the account */
export async function listFolders(): Promise<string[]> {
  if (!KEY || !SEC) return []
  const data = await apiGet('folders')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.folders ?? []).map((f: any) => f.path as string)
}

async function fetchPage(params: Record<string, string>): Promise<{ resources: CloudinaryAsset[]; next_cursor?: string }> {
  return apiGet('resources/image', params)
}

const BASE_PARAMS = { type: 'upload', max_results: '500', image_metadata: 'true' }

export async function getFolder(folder: string): Promise<CloudinaryAsset[]> {
  if (!KEY || !SEC) return []

  const byAssetFolder = await collectPages<CloudinaryAsset>({ ...BASE_PARAMS, asset_folder: folder })
  if (byAssetFolder.length > 0) return byAssetFolder

  const byPrefix = await collectPages<CloudinaryAsset>({ ...BASE_PARAMS, prefix: folder })
  if (byPrefix.length > 0) return byPrefix

  return collectPages<CloudinaryAsset>({ ...BASE_PARAMS, prefix: `${folder}/` })
}

export async function getCommunityPhotos(): Promise<CommunityAsset[]> {
  if (!KEY || !SEC) return []

  const byAsset = await collectPages<CommunityAsset>(
    { ...BASE_PARAMS, asset_folder: 'public-uploads', context: 'true' }
  )
  if (byAsset.length > 0) return sortByTaken(byAsset)

  const byPrefix = await collectPages<CommunityAsset>(
    { ...BASE_PARAMS, prefix: 'public-uploads', context: 'true' }
  )
  return sortByTaken(byPrefix)
}

function sortByTaken<T extends CloudinaryAsset>(assets: T[]): T[] {
  return assets.slice().sort((a, b) => photoTakenAt(a).getTime() - photoTakenAt(b).getTime())
}

async function collectPages<T extends CloudinaryAsset = CloudinaryAsset>(baseParams: Record<string, string>): Promise<T[]> {
  const all: T[] = []
  let nextCursor: string | undefined

  do {
    const params = { ...baseParams, ...(nextCursor ? { next_cursor: nextCursor } : {}) }
    const data = await fetchPage(params)
    all.push(...(data.resources as T[] ?? []))
    nextCursor = data.next_cursor
  } while (nextCursor)

  // Sort oldest first (earliest photo taken first)
  return all.sort((a, b) => photoTakenAt(a).getTime() - photoTakenAt(b).getTime())
}
