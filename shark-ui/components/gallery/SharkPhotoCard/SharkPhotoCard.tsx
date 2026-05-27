'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, ZoomIn } from 'lucide-react'
import { cn } from '@/utils'

export interface Photo {
  id: string
  src: string
  alt: string
  filename?: string
}

export interface SharkPhotoCardProps {
  photo: Photo
  index: number
  total: number
  onOpen?: (photo: Photo) => void
  onDownload?: (photo: Photo) => void
  className?: string
}

const MAX_RETRIES = 4

export function SharkPhotoCard({ photo, index, total, onOpen, onDownload, className }: SharkPhotoCardProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const retriesRef = useRef(0)

  function handleError() {
    if (retriesRef.current < MAX_RETRIES) {
      const delay = Math.pow(2, retriesRef.current) * 300 + Math.floor(index / 8) * 300
      retriesRef.current++
      setTimeout(() => {
        const img = document.getElementById(`photo-${photo.id}`) as HTMLImageElement | null
        if (img) {
          const src = photo.src
          img.src = ''
          img.src = src
        }
      }, delay)
    } else {
      setError(true)
    }
  }

  return (
    <div className={cn('flex flex-col rounded-[12px] overflow-hidden border border-[#e2e8f0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]', className)}>
      {/* Image area */}
      <div className="relative overflow-hidden bg-[#f1f5f9] aspect-[4/3]">
        {!error ? (
          <>
            <motion.img
              id={`photo-${photo.id}`}
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              onError={handleError}
              className={cn('w-full h-full object-cover transition-opacity', loaded ? 'opacity-100' : 'opacity-0')}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#e2e8f0] border-t-[#94a3b8] rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#94a3b8] text-sm">
            Image unavailable
          </div>
        )}

        {/* Hover overlay */}
        {loaded && (
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
            onClick={() => onOpen?.(photo)}
          >
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
              <ZoomIn className="w-5 h-5 text-[#0f172a]" />
            </div>
          </div>
        )}
      </div>

      {/* Save bar — always visible */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-t border-[#f1f5f9]">
        <span className="font-mono text-xs text-[#94a3b8]">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <button
          onClick={() => onDownload?.(photo)}
          className="flex items-center gap-1.5 bg-[#0f172a] text-white text-xs font-body font-medium px-2.5 py-1.5 rounded-[6px] hover:bg-[#1e293b] transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(251,191,36,0.4)]"
          aria-label={`Download ${photo.filename ?? photo.alt}`}
        >
          <Download className="w-3 h-3" />
          Save
        </button>
      </div>
    </div>
  )
}
