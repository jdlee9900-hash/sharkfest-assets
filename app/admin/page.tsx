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
  const { data: registrations } = await service
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false })

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
        <AdminDashboard registrations={registrations ?? []} />
      </main>
    </>
  )
}
