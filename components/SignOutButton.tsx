'use client'

import { useRouter } from 'next/navigation'

interface Props {
  className?: string
  children?: React.ReactNode
}

export function SignOutButton({ className = 'mb-signout', children = 'Sign out' }: Props) {
  const router = useRouter()

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button className={className} onClick={handleSignOut}>
      {children}
    </button>
  )
}
