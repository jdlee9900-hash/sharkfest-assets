const CLOUD = process.env.CLOUDINARY_CLOUD_NAME ?? 'c-ced7723b838bd9dbf940dffe6eee3c'
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

export async function getFolder(folder: string): Promise<CloudinaryAsset[]> {
  if (!KEY || !SEC) return []

  const auth = Buffer.from(`${KEY}:${SEC}`).toString('base64')
  const all: CloudinaryAsset[] = []
  let nextCursor: string | undefined

  do {
    const params = new URLSearchParams({
      prefix:      folder,
      type:        'upload',
      max_results: '500',
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    })

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD}/resources/image?${params}`,
      {
        headers: { Authorization: `Basic ${auth}` },
        next: { revalidate: 3600 },
      }
    )

    if (!res.ok) throw new Error(`Cloudinary API error ${res.status}`)
    const data = await res.json()
    all.push(...(data.resources as CloudinaryAsset[]))
    nextCursor = data.next_cursor
  } while (nextCursor)

  // Sort by upload date — newest first
  return all.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}
