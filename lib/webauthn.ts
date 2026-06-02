export function getWebAuthnConfig() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  try {
    const url = new URL(raw)
    return { rpID: url.hostname, expectedOrigin: url.origin }
  } catch {
    return { rpID: 'localhost', expectedOrigin: 'http://localhost:3000' }
  }
}
