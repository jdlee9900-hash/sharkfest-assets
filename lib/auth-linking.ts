import { createServiceClient } from '@/lib/supabase/server'

/**
 * Tie a freshly authenticated user to any data keyed off their email, and keep
 * their member flag in sync. Runs after any successful sign-in (magic link,
 * passkey-issued link, or OTP code) so the behaviour is identical regardless of
 * how the user got here.
 */
export async function linkUserToAccount(userId: string, email: string) {
  const service = createServiceClient()

  // Link any registrations with this email that aren't yet tied to a user account.
  await service
    .from('registrations')
    .update({ user_id: userId })
    .eq('email', email)
    .is('user_id', null)

  // Stamp partner_user_id when a partner first logs in — lets them access
  // the shared booking going forward without needing the email match each time.
  await service
    .from('registrations')
    .update({ partner_user_id: userId })
    .ilike('partner_email', email)
    .is('partner_user_id', null)

  // Keep the member flag on this user's registrations in sync with their
  // current membership, so member pricing applies when a plan is allocated.
  const { isActiveMember } = await import('@/lib/membership')
  const member = await isActiveMember(userId)
  await service.from('registrations').update({ is_member: member }).eq('user_id', userId)
}
