import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SharkFest — Torbay Sharks RFC',
    short_name: 'SharkFest',
    description: 'Your SharkFest membership, booking and festival updates — all in one place.',
    id: '/',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0f1e',
    theme_color: '#0a0f1e',
    categories: ['sports', 'events', 'lifestyle'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Members area', short_name: 'Members', url: '/members?source=pwa', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
      { name: 'My booking',   short_name: 'Booking', url: '/my-booking?source=pwa', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
    ],
  }
}
