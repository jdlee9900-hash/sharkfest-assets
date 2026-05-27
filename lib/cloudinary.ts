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

export async function getFolder(folder: string): Promise<CloudinaryAsset[]> {
  if (!KEY || !SEC) return []

  const all: CloudinaryAsset[] = []
  let nextCursor: string | undefined

  do {
    const params: Record<string, string> = {
      type:        'upload',
      max_results: '500',
      prefix:      folder.endsWith('/') ? folder : `${folder}/`,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    }

    const data = await apiGet('resources/image', params)
    all.push(...(data.resources as CloudinaryAsset[]))
    nextCursor = data.next_cursor
  } while (nextCursor)

  return all.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}
