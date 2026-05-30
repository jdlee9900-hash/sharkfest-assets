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
    service.from('payment_plans').select('registration_id, total_amount'),
    service.from('payments').select('registration_id, amount').eq('status', 'paid'),
  ])

  // Summary totals for the strip
  const totalDue      = (planResult.data ?? []).reduce((s: number, p: { total_amount: number }) => s + p.total_amount, 0)
  const totalReceived = (payResult.data  ?? []).reduce((s: number, p: { amount: number })       => s + p.amount, 0)

  // Per-registration payment summaries for the remind button
  const paymentSummaries: Record<string, { totalDue: number; totalPaid: number }> = {}
  for (const plan of planResult.data ?? []) {
    paymentSummaries[plan.registration_id] = { totalDue: plan.total_amount, totalPaid: 0 }
  }
  for (const pay of payResult.data ?? []) {
    if (paymentSummaries[pay.registration_id]) {
      paymentSummaries[pay.registration_id].totalPaid += pay.amount
    }
  }

  return (
    <main style={{ padding: '2rem 1rem 4rem', maxWidth: '1400px', margin: '0 auto' }}>
      <AdminDashboard
        registrations={regResult.data ?? []}
        totalDue={totalDue}
        totalReceived={totalReceived}
        paymentSummaries={paymentSummaries}
      />
    </main>
  )
}
