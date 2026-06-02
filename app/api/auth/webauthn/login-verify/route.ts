import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/types'
import { createServiceClient } from '@/lib/supabase/server'
import { getWebAuthnConfig } from '@/lib/webauthn'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const challenge = cookieStore.get('wac')?.value
  if (!challenge) {
    return NextResponse.json({ error: 'Challenge missing or expired' }, { status: 400 })
  }

  cookieStore.delete('wac')

  const body: AuthenticationResponseJSON = await request.json()
  const { expectedOrigin, rpID } = getWebAuthnConfig()

  const service = createServiceClient()

  const { data: cred, error: credErr } = await service
    .from('webauthn_credentials')
    .select('*')
    .eq('credential_id', body.id)
    .single()

  if (credErr || !cred) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
  }

  const { data: userData } = await service.auth.admin.getUserById(cred.user_id)
  const userEmail = userData?.user?.email
  if (!userEmail) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: cred.credential_id,
        publicKey: new Uint8Array(Buffer.from(cred.public_key, 'base64')),
        counter: cred.counter,
        transports: (cred.transports ?? []) as AuthenticatorTransport[],
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Verification failed' }, { status: 400 })
  }

  const { verified, authenticationInfo } = verification
  if (!verified || !authenticationInfo) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 400 })
  }

  await service
    .from('webauthn_credentials')
    .update({ counter: authenticationInfo.newCounter })
    .eq('credential_id', cred.credential_id)

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback?next=/members`
  const { data } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: userEmail,
    options: { redirectTo },
  })

  if (!data?.properties?.action_link) {
    return NextResponse.json({ error: 'Could not create session link' }, { status: 500 })
  }

  return NextResponse.json({ redirect: data.properties.action_link })
}
