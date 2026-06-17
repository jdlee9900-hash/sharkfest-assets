import type { NextConfig } from 'next'

// Content-Security-Policy for the app's known external origins:
//   - Cloudinary (gallery images)        res.cloudinary.com / api.cloudinary.com
//   - Supabase (auth + data)             *.supabase.co
//   - Stripe (checkout is a redirect, not an embed; no frame-src needed)
// Next.js injects inline bootstrap scripts and the app uses inline `style={{…}}`
// attributes, so 'unsafe-inline' is required for script/style here (a nonce-based
// policy would need middleware wiring). This is shipped Report-Only first so it
// cannot break the live site — review violations in the browser console / your
// reporting endpoint, then rename the header to `Content-Security-Policy` to enforce.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.cloudinary.com https://res.cloudinary.com https://*.supabase.co https://api.stripe.com",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // PWA: same-origin service worker + web app manifest.
  "worker-src 'self'",
  "manifest-src 'self'",
].join('; ')

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy-Report-Only', value: csp },
]

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/c-ced7723b838bd9dbf940dffe6eee3c/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default config
