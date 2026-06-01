/*
 * SharkFest service worker.
 *
 * Deliberately conservative because the app is auth-gated:
 *   - Static assets (Next build output, icons, images) → cache-first.
 *   - Page navigations → network-first with an offline fallback. Authenticated
 *     HTML is never persisted, so one member's booking can't be served to another
 *     on a shared device.
 *   - Anything under /api, /auth, or any non-GET request → always straight to the
 *     network, never cached.
 */
const VERSION = 'sharkfest-v1'
const STATIC_CACHE = `${VERSION}-static`
const OFFLINE_URL = '/offline.html'

const PRECACHE = [
  OFFLINE_URL,
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon-') ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/favicon-32.png' ||
    url.pathname === '/logo.png' ||
    /\.(?:css|js|woff2?|png|jpe?g|svg|webp|avif|ico)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Same-origin only — let Stripe/Supabase/Cloudinary etc. go straight through.
  if (url.origin !== self.location.origin) return

  // Never cache API or auth traffic — always live.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return

  // Static assets: cache-first, then fill the cache on first hit.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(STATIC_CACHE).then(cache => cache.put(request, copy))
          }
          return response
        })
      })
    )
    return
  }

  // Navigations: network-first, fall back to the offline page when truly offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    )
    return
  }
})

// Let the page tell a freshly-installed worker to take over immediately.
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})
