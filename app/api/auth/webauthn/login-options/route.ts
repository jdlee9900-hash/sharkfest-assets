import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { getWebAuthnConfig } from '@/lib/webauthn'

export async function POST() {
  const { rpID } = getWebAuthnConfig()

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: [],
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
