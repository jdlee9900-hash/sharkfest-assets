import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/AdminDashboard'
import { adminEmails } from '@/lib/types'

export const metadata: Metadata = { title: 'Admin · SharkFest 2028' }
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin')
  if (!adminEmails().includes(user.email ?? '')) redirect('/')

  const service = createServiceClient()
  const [regResult, planResult, payResult] = await Promise.all([
    service.from('registrations').select('*').order('created_at', { ascending: false }),
    service.from('payment_plans').select('total_amount'),
    service.from('payments').select('amount').eq('status', 'paid'),
  ])

  const totalDue      = (planResult.data ?? []).reduce((s: number, p: { total_amount: number }) => s + p.total_amount, 0)
  const totalReceived = (payResult.data  ?? []).reduce((s: number, p: { amount: number })       => s + p.amount, 0)

  return (
    <>
      <header className="rc-header">
        <Link href="/" className="rc-header-logo" aria-label="Back to SharkFest">
          <Image src="/logo.png" alt="Torbay Sharks RFC" width={36} height={36} />
          <span>SharkFest</span>
        </Link>
        <nav className="rc-header-nav" aria-label="Site navigation">
          <Link href="/">Home</Link>
          <Link href="/register">Register 2028</Link>
        </nav>
      </header>

      <main style={{ padding: '2rem 1rem 4rem', maxWidth: '1400px', margin: '0 auto' }}>
        <AdminDashboard
          registrations={regResult.data ?? []}
          totalDue={totalDue}
          totalReceived={totalReceived}
        />
      </main>
    </>
  )
}
