import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import type { RegistrationResponseJSON } from '@simplewebauthn/types'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getWebAuthnConfig } from '@/lib/webauthn'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cookieStore = await cookies()
  const challenge = cookieStore.get('wac')?.value
  if (!challenge) {
    return NextResponse.json({ error: 'Challenge missing or expired' }, { status: 400 })
  }

  cookieStore.delete('wac')

  const body: RegistrationResponseJSON = await request.json()
  const { expectedOrigin, rpID } = getWebAuthnConfig()

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Verification failed' }, { status: 400 })
  }

  const { verified, registrationInfo } = verification
  if (!verified || !registrationInfo) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error: dbErr } = await service.from('webauthn_credentials').insert({
    user_id: user.id,
    credential_id: registrationInfo.credential.id,
    public_key: Buffer.from(registrationInfo.credential.publicKey).toString('base64'),
    counter: registrationInfo.credential.counter,
    transports: body.response.transports ?? [],
  })

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  return NextResponse.json({ verified: true })
}
