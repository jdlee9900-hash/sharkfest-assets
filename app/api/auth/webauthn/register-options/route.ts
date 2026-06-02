import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getWebAuthnConfig } from '@/lib/webauthn'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data: existingCreds } = await service
    .from('webauthn_credentials')
    .select('credential_id, transports')
    .eq('user_id', user.id)

  const { rpID } = getWebAuthnConfig()

  const options = await generateRegistrationOptions({
    rpName: 'SharkFest',
    rpID,
    userID: Buffer.from(user.id),
    userName: user.email ?? '',
    userDisplayName: user.email ?? '',
    attestationType: 'none',
    excludeCredentials: (existingCreds ?? []).map(c => ({
      id: c.credential_id,
      transports: (c.transports ?? []) as AuthenticatorTransport[],
    })),
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required',
    },
  })

  const cookieStore = await cookies()
  cookieStore.set('wac', options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 300,
    path: '/',
  })

  return NextResponse.json(options)
}
