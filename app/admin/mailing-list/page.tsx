import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'
import { MailingListManager } from '@/components/MailingListManager'

export const metadata: Metadata = { title: 'Mailing List · Admin · SharkFest' }
export const dynamic = 'force-dynamic'

export default async function MailingListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/mailing-list')
  if (!adminEmails().includes(user.email ?? '')) redirect('/')

  return (
    <main style={{ padding: '2rem 1rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      <MailingListManager />
    </main>
  )
}
