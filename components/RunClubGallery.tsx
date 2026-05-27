'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CloudinaryAsset } from '@/lib/cloudinary'
import { thumbUrl, fullUrl } from '@/lib/cloudinary'

interface Props {
  images: CloudinaryAsset[]
}

export function RunClubGallery({ images }: Props) {
  const [open,    setOpen]    = useState<number | null>(null)
  const [loaded,  setLoaded]  = useState<Set<string>>(new Set())
  const closeRef = useRef<HTMLButtonElement>(null)

  const prev = useCallback(() => setOpen(i => i !== null ? Math.max(0, i - 1) : null), [])
  const next = useCallback(() => setOpen(i => i !== null ? Math.min(images.length - 1, i + 1) : null), [images.length])
  const close = useCallback(() => setOpen(null), [])

  // keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (open === null) return
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'Escape')     close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, next, prev, close])

  // scroll lock
  useEffect(() => {
    document.body.style.overflow = open !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // trap focus on close button when lightbox opens
  useEffect(() => {
    if (open !== null) closeRef.current?.focus()
  }, [open])

  return (
    <>
      {/* Masonry grid */}
      <div className="rc-masonry" role="list">
        {images.map((img, i) => {
          const isLoaded = loaded.has(img.public_id)
          return (
            <button
              key={img.public_id}
              className={`rc-item ${isLoaded ? 'rc-item--ready' : ''}`}
              onClick={() => setOpen(i)}
              aria-label={`View run club photo ${i + 1} of ${images.length}`}
              role="listitem"
            >
              {/* placeholder blur */}
              <div className="rc-placeholder" aria-hidden="true" />
              <img
                src={thumbUrl(img.public_id)}
                alt=""
                loading={i < 12 ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={() => setLoaded(s => new Set([...s, img.public_id]))}
                style={{ aspectRatio: `${img.width}/${img.height}` }}
              />
              <div className="rc-item-overlay" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </div>
            </button>
          )
        })}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {open !== null && (
          <motion.div
            className="lb-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={`Photo ${open + 1} of ${images.length}`}
          >
            {/* Counter */}
            <div className="lb-counter" aria-live="polite">
              {open + 1} <span>/</span> {images.length}
            </div>

            {/* Close */}
            <button
              ref={closeRef}
              className="lb-close"
              onClick={close}
              aria-label="Close lightbox"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>

            {/* Image */}
            <motion.div
              key={open}
              className="lb-img-wrap"
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <img
                src={fullUrl(images[open].public_id)}
                alt={`Run club photo ${open + 1}`}
                className="lb-img"
              />
            </motion.div>

            {/* Prev */}
            {open > 0 && (
              <button
                className="lb-nav lb-nav--prev"
                onClick={e => { e.stopPropagation(); prev() }}
                aria-label="Previous photo"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
            )}

            {/* Next */}
            {open < images.length - 1 && (
              <button
                className="lb-nav lb-nav--next"
                onClick={e => { e.stopPropagation(); next() }}
                aria-label="Next photo"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            )}

            {/* Strip preview */}
            <div className="lb-strip" onClick={e => e.stopPropagation()} aria-hidden="true">
              {images.slice(Math.max(0, open - 4), Math.min(images.length, open + 5)).map((img, _, arr) => {
                const globalIdx = images.indexOf(img)
                return (
                  <button
                    key={img.public_id}
                    className={`lb-strip-thumb ${globalIdx === open ? 'lb-strip-thumb--active' : ''}`}
                    onClick={() => setOpen(globalIdx)}
                    tabIndex={-1}
                  >
                    <img src={thumbUrl(img.public_id)} alt="" loading="lazy" />
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
