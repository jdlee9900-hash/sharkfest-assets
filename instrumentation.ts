// Next.js instrumentation hook — runs once at server startup.
// Validates that all required environment variables are present so
// misconfigured deployments fail loudly instead of silently misbehaving.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const required: Record<string, string> = {
    NEXT_PUBLIC_SUPABASE_URL:   'Supabase project URL',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anon key',
    SUPABASE_SERVICE_ROLE_KEY:  'Supabase service-role key (server only)',
    STRIPE_SECRET_KEY:          'Stripe secret key',
    STRIPE_WEBHOOK_SECRET:      'Stripe webhook signing secret',
    ADMIN_EMAILS:               'Comma-separated list of admin email addresses',
    CLOUDINARY_CLOUD_NAME:      'Cloudinary cloud name',
    NEXT_PUBLIC_SITE_URL:       'Canonical site URL (used in email links)',
  }

  const missing = Object.entries(required)
    .filter(([key]) => !process.env[key])
    .map(([key, desc]) => `  ${key} — ${desc}`)

  if (missing.length > 0) {
    console.error(
      `[startup] Missing required environment variables:\n${missing.join('\n')}\n` +
      'The application may not work correctly until these are set.'
    )
  }
}
