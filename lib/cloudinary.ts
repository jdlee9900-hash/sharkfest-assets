const CLOUD = process.env.CLOUDINARY_CLOUD_NAME ?? 'dtrgis7lb'
const KEY   = process.env.CLOUDINARY_API_KEY    ?? ''
const SEC   = process.env.CLOUDINARY_API_SECRET ?? ''

export interface CloudinaryAsset {
  public_id: string
  width: number
  height: number
  format: string
  created_at: string
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

export async function getFolder(folder: string): Promise<CloudinaryAsset[]> {
  if (!KEY || !SEC) return []

  // Try 1: asset_folder mode (Cloudinary dynamic/fixed folder mode)
  const byAssetFolder = await collectPages<CloudinaryAsset>({ type: 'upload', max_results: '500', asset_folder: folder })
  if (byAssetFolder.length > 0) return byAssetFolder

  // Try 2: prefix without trailing slash (legacy folder mode)
  const byPrefix = await collectPages<CloudinaryAsset>({ type: 'upload', max_results: '500', prefix: folder })
  if (byPrefix.length > 0) return byPrefix

  // Try 3: prefix with trailing slash
  return collectPages<CloudinaryAsset>({ type: 'upload', max_results: '500', prefix: `${folder}/` })
}

export async function getCommunityPhotos(): Promise<CommunityAsset[]> {
  if (!KEY || !SEC) return []

  // Try asset_folder first (dynamic folder mode), then prefix
  const byAsset = await collectPages<CommunityAsset>(
    { type: 'upload', max_results: '500', asset_folder: 'public-uploads', context: 'true' }
  )
  if (byAsset.length > 0) return sortCommunity(byAsset)

  const byPrefix = await collectPages<CommunityAsset>(
    { type: 'upload', max_results: '500', prefix: 'public-uploads', context: 'true' }
  )
  return sortCommunity(byPrefix)
}

function sortCommunity(photos: CommunityAsset[]): CommunityAsset[] {
  return photos.slice().sort((a, b) => {
    const ta = a.context?.custom?.photo_taken_at || a.created_at
    const tb = b.context?.custom?.photo_taken_at || b.created_at
    return new Date(ta).getTime() - new Date(tb).getTime()
  })
}

async function collectPages<T extends CloudinaryAsset = CloudinaryAsset>(baseParams: Record<string, string>): Promise<T[]> {
  const all: T[] = []
  let nextCursor: string | undefined

  do {
    const params = { ...baseParams, ...(nextCursor ? { next_cursor: nextCursor } : {}) }
    const data = await fetchPage(params)
    all.push(...(data.resources ?? []))
    nextCursor = data.next_cursor
  } while (nextCursor)

  return all.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}
