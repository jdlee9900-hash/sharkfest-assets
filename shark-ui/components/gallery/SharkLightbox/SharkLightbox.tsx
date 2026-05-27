'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { Photo } from '../SharkPhotoCard/SharkPhotoCard'
import { cn } from '@/utils'

export interface SharkLightboxProps {
  photos: Photo[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
  onDownload?: (photo: Photo) => void
}

export function SharkLightbox({ photos, currentIndex, onClose, onNavigate, onDownload }: SharkLightboxProps) {
  const photo = photos[currentIndex]
  const [imgKey, setImgKey] = useState(currentIndex)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const prev = useCallback(() => {
    if (currentIndex > 0) { onNavigate(currentIndex - 1); setImgKey(currentIndex - 1) }
  }, [currentIndex, onNavigate])

  const next = useCallback(() => {
    if (currentIndex < photos.length - 1) { onNavigate(currentIndex + 1); setImgKey(currentIndex + 1) }
  }, [currentIndex, onNavigate, photos.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     onClose()
      if (e.key === 'd' || e.key === 'D') onDownload?.(photo)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [prev, next, onClose, onDownload, photo])

  function onTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX)
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return
    const dx = e.changedTouches[0].clientX - touchStartX
    if (dx > 50) prev()
    else if (dx < -50) next()
    setTouchStartX(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col bg-[rgba(15,23,42,0.95)] backdrop-blur-[8px]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-none">
        <span className="font-mono text-xs text-white/50">
          {currentIndex + 1} / {photos.length}
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden" onClick={onClose}>
        <AnimatePresence mode="wait">
          <motion.img
            key={imgKey}
            src={photo.src}
            alt={photo.alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
          />
        </AnimatePresence>

        {/* Nav arrows */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Footer bar — always visible */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 flex-none bg-[rgba(15,23,42,0.6)]">
        <div>
          {photo.filename && (
            <p className="font-mono text-xs text-white/60">{photo.filename}</p>
          )}
          <p className="text-xs text-white/40 mt-0.5">Press D to download · ← → to navigate · Esc to close</p>
        </div>
        <button
          onClick={() => onDownload?.(photo)}
          className="flex items-center gap-2 bg-[#0f172a] text-white text-sm font-body font-medium px-4 py-2 rounded-[8px] hover:bg-[#1e293b] border border-white/10 transition-colors"
          aria-label={`Download ${photo.filename ?? photo.alt}`}
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
    </motion.div>
  )
}
