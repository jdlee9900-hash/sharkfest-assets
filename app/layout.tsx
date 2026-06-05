import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { PWARegister } from '@/components/PWARegister'

export const metadata: Metadata = {
  title: 'SharkFest — Torbay Sharks RFC',
  description: 'Three days, two marquees, one community on the Devon Coast. Relive SharkFest 2026.',
  applicationName: 'SharkFest',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SharkFest',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'SharkFest — Torbay Sharks RFC',
    description: 'Three days, two marquees, one community on the Devon Coast. Relive SharkFest 2026.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0f1e',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-4F3RX40SKB"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-4F3RX40SKB');
          `}
        </Script>
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <PWARegister />
      </body>
    </html>
  )
}
