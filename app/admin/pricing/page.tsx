import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'
import { getPricing } from '@/lib/pricing-server'
import { AdminPricing } from '@/components/AdminPricing'

export const metadata: Metadata = { title: 'Pricing · Admin · SharkFest' }
export const dynamic = 'force-dynamic'

export default async function AdminPricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/pricing')
  if (!adminEmails().includes(user.email ?? '')) redirect('/')

  const pricing = await getPricing()

  return (
    <main style={{ padding: '2rem 1rem 4rem', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 className="mb-title">Pricing</h1>
        <p className="mb-email">Membership prices and SharkFest fees. Changes apply to the website immediately.</p>
      </div>
      <AdminPricing initial={pricing} />
    </main>
  )
}
