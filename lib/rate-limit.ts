// Lightweight in-memory rate limiter — no external infra/dependency.
//
// NOTE: state lives in the function instance's memory, so on Vercel it is
// per-instance and best-effort (a burst spread across many cold instances can
// slip through, and counters reset on cold start). It still stops the common
// case — one client hammering one warm instance — and adds zero dependencies.
// For a hard, globally-consistent limit, swap this for Upstash Redis
// (@upstash/ratelimit) behind the same `rateLimit()` signature.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Fixed-window limiter. Returns `ok: false` once `limit` requests have been
 * seen for `key` within `windowMs`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  existing.count++
  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) }
  }

  // Opportunistic cleanup so the map can't grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k)
  }

  return { ok: true, remaining: limit - existing.count, retryAfterSeconds: 0 }
}

/** Best-effort client IP from standard proxy headers (Vercel sets these). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
