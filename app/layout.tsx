import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'SharkFest — Torbay Sharks RFC',
  description: 'Three days, two marquees, one community on the Devon Coast. Relive SharkFest 2026.',
  openGraph: {
    title: 'SharkFest — Torbay Sharks RFC',
    description: 'Three days, two marquees, one community on the Devon Coast. Relive SharkFest 2026.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  )
}
