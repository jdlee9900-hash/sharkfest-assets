'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { thumbUrl, fullUrl, photoTakenAt } from '@/lib/cloudinary'
import type { CommunityAsset, CloudinaryAsset } from '@/lib/cloudinary'

// ── Day-grouping helpers ─────────────────────────────────────────────────────

interface DayGroup {
  key: string
  label: string
  photos: CommunityAsset[]
}

function photoDateKey(p: CloudinaryAsset): string {
  const d = photoTakenAt(p)
  return isNaN(d.getTime()) ? 'other' : d.toISOString().slice(0, 10)
}

function dateLabel(key: string): string {
  if (key === 'other') return 'Other'
  const d = new Date(key + 'T12:00:00Z')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
}

function groupByDay(photos: CommunityAsset[]): DayGroup[] {
  const map = new Map<string, CommunityAsset[]>()
  for (const p of photos) {
    const key = photoDateKey(p)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a === 'other' ? 1 : b === 'other' ? -1 : a.localeCompare(b)))
    .map(([key, ps]) => ({
      key,
      label: dateLabel(key),
      photos: ps.slice().sort((a, b) => photoTakenAt(a).getTime() - photoTakenAt(b).getTime()),
    }))
}

// ── Shared masonry grid ──────────────────────────────────────────────────────

function PhotoGrid({
  photos,
  loaded,
  onLoad,
  onOpen,
  showUploader = false,
}: {
  photos: CloudinaryAsset[]
  loaded: Set<string>
  onLoad: (id: string) => void
  onOpen: (idx: number) => void
  showUploader?: boolean
}) {
  return (
    <div className="rc-masonry" role="list">
      {photos.map((photo, idx) => {
        const name = showUploader ? (photo as CommunityAsset).context?.custom?.uploader_name : undefined
        return (
          <button
            key={photo.public_id}
            className={`rc-item rc-item--community ${loaded.has(photo.public_id) ? 'rc-item--ready' : ''}`}
            onClick={() => onOpen(idx)}
            aria-label={name ? `Photo by ${name}` : `Photo ${idx + 1}`}
            role="listitem"
          >
            <div className="rc-placeholder" aria-hidden="true" />
            <img
              src={thumbUrl(photo.public_id, 600)}
              alt=""
              loading={idx < 12 ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={() => onLoad(photo.public_id)}
              style={photo.width && photo.height ? { aspectRatio: `${photo.width}/${photo.height}` } : undefined}
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
  )
}

// ── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  photos,
  openIdx,
  onClose,
  onPrev,
  onNext,
  onJump,
  showUploader = false,
}: {
  photos: CloudinaryAsset[]
  openIdx: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onJump: (idx: number) => void
  showUploader?: boolean
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const current = photos[openIdx]
  const uploaderName = showUploader ? (current as CommunityAsset)?.context?.custom?.uploader_name : undefined

  useEffect(() => { closeRef.current?.focus() }, [openIdx])
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft')  onPrev()
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onNext, onPrev, onClose])

  const strip = photos.slice(Math.max(0, openIdx - 4), Math.min(photos.length, openIdx + 5))

  return (
    <motion.div
      className="lb-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      role="dialog" aria-modal="true"
      aria-label={`Photo ${openIdx + 1} of ${photos.length}`}
    >
      <div className="lb-counter" aria-live="polite">{openIdx + 1} <span>/</span> {photos.length}</div>
      <button ref={closeRef} className="lb-close" onClick={onClose} aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>

      <motion.div
        key={openIdx}
        className="lb-img-wrap"
        initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <img src={fullUrl(current.public_id)} alt={uploaderName ? `Photo by ${uploaderName}` : 'Photo'} className="lb-img" />
        {uploaderName && (
          <div className="lb-uploader">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            {uploaderName}
          </div>
        )}
      </motion.div>

      {openIdx > 0 && (
        <button className="lb-nav lb-nav--prev" onClick={e => { e.stopPropagation(); onPrev() }} aria-label="Previous">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      )}
      {openIdx < photos.length - 1 && (
        <button className="lb-nav lb-nav--next" onClick={e => { e.stopPropagation(); onNext() }} aria-label="Next">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      )}

      <div className="lb-strip" onClick={e => e.stopPropagation()} aria-hidden="true">
        {strip.map(p => {
          const gi = photos.indexOf(p)
          return (
            <button
              key={p.public_id}
              className={`lb-strip-thumb ${gi === openIdx ? 'lb-strip-thumb--active' : ''}`}
              onClick={() => onJump(gi)}
              tabIndex={-1}
            >
              <img src={thumbUrl(p.public_id, 120)} alt="" loading="lazy" />
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type Source = 'community' | 'runclub'

export function CommunityGallery({
  photos,
  runClubPhotos,
}: {
  photos: CommunityAsset[]
  runClubPhotos: CloudinaryAsset[]
}) {
  const [source,    setSource]    = useState<Source>('community')
  const [activeKey, setActiveKey] = useState('all')
  const [loaded,    setLoaded]    = useState<Set<string>>(new Set())
  const [openIdx,   setOpenIdx]   = useState<number | null>(null)

  const markLoaded = useCallback((id: string) => setLoaded(s => new Set([...s, id])), [])

  const switchSource = (s: Source) => { setSource(s); setActiveKey('all'); setOpenIdx(null) }

  // ── Community view ──────────────────────────────
  const groups    = groupByDay(photos)
  const dayKeys   = ['all', ...groups.map(g => g.key)]
  const visGroups = activeKey === 'all' ? groups : groups.filter(g => g.key === activeKey)
  const flatComm  = visGroups.flatMap(g => g.photos)

  // ── Run Club view ───────────────────────────────
  const activeFlat = source === 'community' ? flatComm : runClubPhotos

  const prev  = useCallback(() => setOpenIdx(i => (i !== null && i > 0 ? i - 1 : i)), [])
  const next  = useCallback(() => setOpenIdx(i => (i !== null && i < activeFlat.length - 1 ? i + 1 : i)), [activeFlat.length])
  const close = useCallback(() => setOpenIdx(null), [])

  return (
    <>
      {/* Source tabs — only shown if run club photos exist */}
      {runClubPhotos.length > 0 && (
        <div className="cg-source-tabs">
          <button
            className={`cg-source-tab ${source === 'community' ? 'cg-source-tab--active' : ''}`}
            onClick={() => switchSource('community')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            Your Photos
            <span className="cg-tab-count">{photos.length}</span>
          </button>
          <button
            className={`cg-source-tab ${source === 'runclub' ? 'cg-source-tab--active' : ''}`}
            onClick={() => switchSource('runclub')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/><path d="m7 21 3-6 2 2 2-4 4 8"/><path d="M5 12c0-3 2-5 5-6"/></svg>
            Run Club
            <span className="cg-tab-count">{runClubPhotos.length}</span>
          </button>
        </div>
      )}

      {/* ── Community: day tabs + grouped grid ─── */}
      {source === 'community' && (
        <>
          {groups.length > 1 && (
            <div className="cg-tabs" role="tablist">
              {dayKeys.map(key => {
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
          )}

          {visGroups.map((group, dayIdx) => (
            <section key={group.key} className="cg-day">
              {activeKey === 'all' && groups.length > 1 && (
                <h3 className="cg-day-title">
                  {group.label}
                  <span className="cg-day-count">{group.photos.length} photos</span>
                </h3>
              )}
              <PhotoGrid
                photos={group.photos}
                loaded={loaded}
                onLoad={markLoaded}
                onOpen={idx => {
                  const offset = visGroups.slice(0, dayIdx).reduce((n, g) => n + g.photos.length, 0)
                  setOpenIdx(offset + idx)
                }}
                showUploader
              />
            </section>
          ))}
        </>
      )}

      {/* ── Run Club: flat chronological grid ──── */}
      {source === 'runclub' && (
        <section className="cg-day">
          <PhotoGrid
            photos={runClubPhotos}
            loaded={loaded}
            onLoad={markLoaded}
            onOpen={setOpenIdx}
          />
        </section>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {openIdx !== null && (
          <Lightbox
            photos={activeFlat}
            openIdx={openIdx}
            onClose={close}
            onPrev={prev}
            onNext={next}
            onJump={setOpenIdx}
            showUploader={source === 'community'}
          />
        )}
      </AnimatePresence>
    </>
  )
}
