'use client'

import { useEffect, useRef } from 'react'
import { formatTime } from '@/utils'
import { cn } from '@/utils'

export interface SharkNowMarkerProps {
  className?: string
  /** If true, scroll into view on mount */
  autoScroll?: boolean
}

export function SharkNowMarker({ className, autoScroll = true }: SharkNowMarkerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [autoScroll])

  const now = new Date()

  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-3 my-4', className)}
      aria-label={`Now: ${formatTime(now)}`}
    >
      {/* NOW badge */}
      <div
        className="flex-none flex items-center gap-1.5 bg-[#ef4444] text-white rounded-full px-3 py-1 font-body font-semibold text-xs"
        style={{ animation: 'nowGlow 1.8s ease infinite' }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full bg-white"
          style={{ animation: 'blink 1.4s ease infinite' }}
        />
        NOW
        <span className="font-mono text-xs text-white/80 ml-1">{formatTime(now)}</span>
      </div>

      {/* Horizontal line */}
      <div className="flex-1 h-px bg-gradient-to-r from-[#ef4444]/40 to-transparent" />
    </div>
  )
}
