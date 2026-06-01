'use client'

import { useEffect, useState } from 'react'

// Minimal shape of the non-standard beforeinstallprompt event (Chromium only).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'sf-install-dismissed'
const DISMISS_DAYS = 21

function recentlyDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY))
    if (!ts) return false
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iOSDevice = /iphone|ipad|ipod/i.test(ua)
  // iPadOS 13+ reports as Mac but has touch — catch that too.
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return iOSDevice || iPadOS
}

type Mode = 'android' | 'ios'

export function InstallPrompt() {
  const [mode, setMode] = useState<Mode | null>(null)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return

    // Android / desktop Chromium: capture the native prompt event.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setMode('android')
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // iOS Safari never fires beforeinstallprompt — show manual instructions after
    // a short delay so it doesn't fight the page's first paint.
    let iosTimer: ReturnType<typeof setTimeout> | undefined
    if (isIOS()) {
      iosTimer = setTimeout(() => {
        if (!isStandalone()) { setMode('ios'); setVisible(true) }
      }, 1200)
    }

    const onInstalled = () => { setVisible(false); dismiss() }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      if (iosTimer) clearTimeout(iosTimer)
    }
  }, [])

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* ignore */ }
    setVisible(false)
  }

  const handleInstall = async () => {
    if (!deferred) return
    setInstalling(true)
    try {
      await deferred.prompt()
      await deferred.userChoice
    } catch { /* user cancelled */ }
    setInstalling(false)
    setDeferred(null)
    setVisible(false)
  }

  if (!visible || !mode) return null

  return (
    <div className="pwa-prompt" role="dialog" aria-label="Install SharkFest app">
      <button className="pwa-prompt-close" onClick={dismiss} aria-label="Dismiss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>

      <div className="pwa-prompt-body">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="pwa-prompt-icon" />

        <div className="pwa-prompt-text">
          <p className="pwa-prompt-title">Install SharkFest</p>

          {mode === 'android' ? (
            <p className="pwa-prompt-sub">
              Add SharkFest to your home screen for one-tap access to your membership and booking.
            </p>
          ) : (
            <p className="pwa-prompt-sub">
              Add SharkFest to your home screen: tap the{' '}
              <span className="pwa-share-ico" aria-label="Share">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/></svg>
              </span>{' '}
              Share button, then choose <strong>“Add to Home Screen”</strong>.
            </p>
          )}
        </div>
      </div>

      {mode === 'android' && (
        <div className="pwa-prompt-actions">
          <button className="btn btn-accent pwa-prompt-cta" onClick={handleInstall} disabled={installing}>
            {installing ? 'Installing…' : 'Install app'}
          </button>
          <button className="pwa-prompt-later" onClick={dismiss}>Not now</button>
        </div>
      )}
    </div>
  )
}
