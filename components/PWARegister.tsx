'use client'

import { useEffect } from 'react'

// Registers the service worker once, after load, so it never competes with the
// initial render. Safe no-op where service workers aren't supported.
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('[pwa] service worker registration failed:', err)
      })
    }

    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])

  return null
}
