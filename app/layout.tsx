import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SharkFest 2028 — Torbay Sharks RFC',
  description: 'Three days, two stages, one pack of sharks. Devon Coast, 26–29 May 2028.',
  openGraph: {
    title: 'SharkFest 2028',
    description: 'Three days, two stages, one pack of sharks. Devon Coast, 26–29 May 2028.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
