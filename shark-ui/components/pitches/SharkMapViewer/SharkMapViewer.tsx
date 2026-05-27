'use client'

import { useRef, useState } from 'react'
import { usePinchZoom } from '@/hooks/usePinchZoom'
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { cn } from '@/utils'

export interface SharkMapViewerProps {
  mapUrl: string
  alt?: string
  className?: string
}

export function SharkMapViewer({ mapUrl, alt = 'Site map', className }: SharkMapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { zoomIn, zoomOut, resetZoom } = usePinchZoom(containerRef)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [hintVisible, setHintVisible] = useState(true)

  return (
    <div
      className={cn('relative overflow-hidden rounded-[16px] bg-[#f1f5f9] border border-[#e2e8f0]', className)}
      style={{ minHeight: 400 }}
      onMouseEnter={() => { setHintVisible(false) }}
    >
      {/* Image container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ willChange: 'transform' }}
      >
        {!error ? (
          <img
            src={mapUrl}
            alt={alt}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={cn('w-full h-auto block transition-opacity', loaded ? 'opacity-100' : 'opacity-0')}
          />
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px] text-[#94a3b8] text-sm">
            Map unavailable
          </div>
        )}
      </div>

      {/* Loading state */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#e2e8f0] border-t-[#0f172a] rounded-full animate-spin" />
        </div>
      )}

      {/* Zoom hint */}
      {hintVisible && loaded && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.75)] text-white text-xs font-body px-3 py-1.5 rounded-full pointer-events-none transition-opacity">
          Scroll to zoom · Drag to pan
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-3 right-3 flex gap-1.5">
        {[
          { icon: <ZoomIn className="w-4 h-4" />, label: 'Zoom in',  fn: zoomIn },
          { icon: <ZoomOut className="w-4 h-4" />,label: 'Zoom out', fn: zoomOut },
          { icon: <Maximize className="w-4 h-4" />,label: 'Reset',   fn: resetZoom },
        ].map(({ icon, label, fn }) => (
          <button
            key={label}
            onClick={fn}
            aria-label={label}
            className="w-8 h-8 rounded-[8px] bg-white/90 backdrop-blur border border-[#e2e8f0] flex items-center justify-center text-[#0f172a] hover:bg-white transition-colors shadow-sm"
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  )
}
