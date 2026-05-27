'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SharkPhotoCard, Photo } from '../SharkPhotoCard/SharkPhotoCard'
import { SharkLightbox } from '../SharkLightbox/SharkLightbox'
import { cn } from '@/utils'

export type GridView = 'masonry' | 'grid'

export interface SharkPhotoGridProps {
  photos: Photo[]
  view?: GridView
  className?: string
}

export function SharkPhotoGrid({ photos, view = 'grid', className }: SharkPhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  function handleDownload(photo: Photo) {
    const a = document.createElement('a')
    a.href = photo.src
    a.download = photo.filename ?? photo.alt
    a.target = '_blank'
    a.click()
  }

  return (
    <>
      <div
        className={cn(
          view === 'grid'
            ? 'grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]'
            : 'columns-3 md:columns-2 sm:columns-1 gap-4 space-y-4',
          className,
        )}
      >
        {photos.map((photo, i) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: (i % 8) * 0.06 }}
            className={view === 'masonry' ? 'break-inside-avoid mb-4' : ''}
          >
            <SharkPhotoCard
              photo={photo}
              index={i}
              total={photos.length}
              onOpen={() => setLightboxIndex(i)}
              onDownload={handleDownload}
            />
          </motion.div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <SharkLightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          onDownload={handleDownload}
        />
      )}
    </>
  )
}
