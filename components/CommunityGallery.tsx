'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { thumbUrl, fullUrl } from '@/lib/cloudinary'
import type { CommunityAsset } from '@/lib/cloudinary'

interface DayGroup {
  key: string        // YYYY-MM-DD or 'other'
  label: string      // 'Friday 22 May' etc.
  photos: CommunityAsset[]
}

function photoDate(p: CommunityAsset): string {
  const raw = p.context?.custom?.photo_taken_at || p.created_at
  return raw ? new Date(raw).toISOString().slice(0, 10) : 'other'
}

function dateLabel(dateKey: string): string {
  if (dateKey === 'other') return 'Other'
  const d = new Date(dateKey + 'T12:00:00Z')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
}

function groupByDay(photos: CommunityAsset[]): DayGroup[] {
  const map = new Map<string, CommunityAsset[]>()
  for (const p of photos) {
    const key = photoDate(p)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => (a === 'other' ? 1 : b === 'other' ? -1 : a.localeCompare(b)))
    .map(([key, ps]) => ({
      key,
      label: dateLabel(key),
      photos: ps.slice().sort((a, b) => {
        const ta = a.context?.custom?.photo_taken_at || a.created_at
        const tb = b.context?.custom?.photo_taken_at || b.created_at
        return new Date(ta).getTime() - new Date(tb).getTime()
      }),
    }))
}

interface LightboxState { dayIdx: number; photoIdx: number }

export function CommunityGallery({ photos }: { photos: CommunityAsset[] }) {
  const groups  = groupByDay(photos)
  const allKeys = ['all', ...groups.map(g => g.key)]

  const [activeKey, setActiveKey] = useState('all')
  const [open, setOpen] = useState<LightboxState | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const activeGroups = activeKey === 'all' ? groups : groups.filter(g => g.key === activeKey)

  const flatPhotos = activeGroups.flatMap(g => g.photos)
  const openIdx    = open ? activeGroups.slice(0, open.dayIdx).reduce((n, g) => n + g.photos.length, 0) + open.photoIdx : -1

  const prev  = useCallback(() => {
    if (open === null) return
    const newFlat = openIdx - 1
    if (newFlat < 0) return
    let remaining = newFlat
    for (let d = 0; d < activeGroups.length; d++) {
      if (remaining < activeGroups[d].photos.length) { setOpen({ dayIdx: d, photoIdx: remaining }); return }
      remaining -= activeGroups[d].photos.length
    }
  }, [open, openIdx, activeGroups])

  const next = useCallback(() => {
    if (open === null) return
    const newFlat = openIdx + 1
    if (newFlat >= flatPhotos.length) return
    let remaining = newFlat
    for (let d = 0; d < activeGroups.length; d++) {
      if (remaining < activeGroups[d].photos.length) { setOpen({ dayIdx: d, photoIdx: remaining }); return }
      remaining -= activeGroups[d].photos.length
    }
  }, [open, openIdx, flatPhotos.length, activeGroups])

  const close = useCallback(() => setOpen(null), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'Escape')     close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, next, prev, close])

  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  useEffect(() => { if (open) closeRef.current?.focus() }, [open])

  const currentPhoto = open ? activeGroups[open.dayIdx]?.photos[open.photoIdx] : null
  const uploaderName = currentPhoto?.context?.custom?.uploader_name

  return (
    <>
      {/* Day filter tabs */}
      <div className="cg-tabs" role="tablist">
        {allKeys.map(key => {
          const group = groups.find(g => g.key === key)
          const label = key === 'all' ? 'All days' : group?.label ?? key
          const count = key === 'all' ? photos.length : (group?.photos.length ?? 0)
          return (
            <button
              key={key}
              role="tab"
              aria-selected={activeKey === key}
              className={`cg-tab ${activeKey === key ? 'cg-tab--active' : ''}`}
              onClick={() => setActiveKey(key)}
            >
              {label}
              <span className="cg-tab-count">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Day sections */}
      {activeGroups.map((group, dayIdx) => (
        <section key={group.key} className="cg-day">
          {activeKey === 'all' && (
            <h3 className="cg-day-title">{group.label} <span className="cg-day-count">{group.photos.length} photos</span></h3>
          )}
          <div className="rc-masonry" role="list">
            {group.photos.map((photo, photoIdx) => {
              const name = photo.context?.custom?.uploader_name
              return (
                <button
                  key={photo.public_id}
                  className="rc-item rc-item--community"
                  onClick={() => setOpen({ dayIdx, photoIdx })}
                  aria-label={`Photo by ${name ?? 'unknown'}`}
                  role="listitem"
                >
                  <div className="rc-placeholder" aria-hidden="true" />
                  <img
                    src={thumbUrl(photo.public_id, 600)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ aspectRatio: `${photo.width}/${photo.height}` }}
                  />
                  <div className="rc-item-overlay" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                  </div>
                  {name && (
                    <div className="cg-uploader-badge" aria-hidden="true">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                      {name}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      ))}

      {/* Lightbox */}
      <AnimatePresence>
        {open !== null && currentPhoto && (
          <motion.div
            className="lb-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            role="dialog" aria-modal="true"
            aria-label={`Photo ${openIdx + 1} of ${flatPhotos.length}`}
          >
            <div className="lb-counter" aria-live="polite">
              {openIdx + 1} <span>/</span> {flatPhotos.length}
            </div>
            <button ref={closeRef} className="lb-close" onClick={close} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>

            <motion.div
              key={`${open.dayIdx}-${open.photoIdx}`}
              className="lb-img-wrap"
              initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <img src={fullUrl(currentPhoto.public_id)} alt={uploaderName ? `Photo by ${uploaderName}` : 'Community photo'} className="lb-img" />
              {uploaderName && (
                <div className="lb-uploader">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  {uploaderName}
                </div>
              )}
            </motion.div>

            {openIdx > 0 && (
              <button className="lb-nav lb-nav--prev" onClick={e => { e.stopPropagation(); prev() }} aria-label="Previous">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
            )}
            {openIdx < flatPhotos.length - 1 && (
              <button className="lb-nav lb-nav--next" onClick={e => { e.stopPropagation(); next() }} aria-label="Next">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            )}

            <div className="lb-strip" onClick={e => e.stopPropagation()} aria-hidden="true">
              {flatPhotos.slice(Math.max(0, openIdx - 4), Math.min(flatPhotos.length, openIdx + 5)).map((p, _, arr) => {
                const gi = flatPhotos.indexOf(p)
                return (
                  <button
                    key={p.public_id}
                    className={`lb-strip-thumb ${gi === openIdx ? 'lb-strip-thumb--active' : ''}`}
                    onClick={() => {
                      let remaining = gi
                      for (let d = 0; d < activeGroups.length; d++) {
                        if (remaining < activeGroups[d].photos.length) { setOpen({ dayIdx: d, photoIdx: remaining }); return }
                        remaining -= activeGroups[d].photos.length
                      }
                    }}
                    tabIndex={-1}
                  >
                    <img src={thumbUrl(p.public_id, 120)} alt="" loading="lazy" />
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
