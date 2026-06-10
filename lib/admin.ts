import { createClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'

/** Returns the authenticated admin user, or null if the caller is not an admin. */
export async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails().includes(user.email ?? '')) return null
  return user
}
