export function getWebAuthnConfig() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  try {
    const url = new URL(raw)
    const hostname = url.hostname
    // rpID must be the registrable domain (no www prefix)
    const rpID = hostname.replace(/^www\./, '')
    // Accept both www and non-www so either works regardless of how the user arrives
    const origins = [url.origin]
    const wwwOrigin = `${url.protocol}//www.${rpID}`
    const bareOrigin = `${url.protocol}//${rpID}`
    if (!origins.includes(wwwOrigin)) origins.push(wwwOrigin)
    if (!origins.includes(bareOrigin)) origins.push(bareOrigin)
    return { rpID, expectedOrigin: origins }
  } catch {
    return { rpID: 'localhost', expectedOrigin: ['http://localhost:3000'] }
  }
}
