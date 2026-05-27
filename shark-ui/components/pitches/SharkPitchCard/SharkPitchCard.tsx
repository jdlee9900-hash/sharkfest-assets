'use client'

import { motion } from 'framer-motion'
import { SharkBadge } from '../../primitives/SharkBadge/SharkBadge'
import { cn } from '@/utils'

export interface Pitch {
  id: string
  area: 'A' | 'B' | 'C'
  number: number
  name?: string
  note?: string
}

export interface SharkPitchCardProps {
  pitch: Pitch
  selected?: boolean
  onSelect?: (pitch: Pitch) => void
  className?: string
}

const areaConfig = {
  A: { badge: 'area-a' as const, accent: '#1d4ed8', bg: '#eff6ff' },
  B: { badge: 'area-b' as const, accent: '#15803d', bg: '#f0fdf4' },
  C: { badge: 'area-c' as const, accent: '#16a34a', bg: '#f0fdf4' },
}

export function SharkPitchCard({ pitch, selected, onSelect, className }: SharkPitchCardProps) {
  const { badge, accent, bg } = areaConfig[pitch.area]

  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      onClick={() => onSelect?.(pitch)}
      className={cn(
        'relative rounded-[12px] p-4 border cursor-pointer transition-all duration-200 select-none',
        selected
          ? 'border-[#fbbf24] shadow-[0_4px_12px_rgba(251,191,36,0.2)]'
          : 'border-[#e2e8f0] bg-white hover:border-[#94a3b8] shadow-[0_1px_4px_rgba(0,0,0,0.06)]',
        className,
      )}
      style={{ backgroundColor: selected ? bg : undefined }}
      role="button"
      aria-pressed={selected}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect?.(pitch) }}
    >
      {selected && (
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[12px]" style={{ backgroundColor: accent }} />
      )}

      <div className="flex items-start justify-between mb-2">
        <SharkBadge variant={badge} size="sm">Area {pitch.area}</SharkBadge>
        {selected && (
          <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: accent }}>
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
        )}
      </div>

      <div className="font-display text-[#0f172a]" style={{ fontSize: '2rem', lineHeight: 0.95 }}>
        {pitch.number}
      </div>

      {pitch.name && (
        <p className="mt-1 text-xs text-[#64748b] font-body truncate">{pitch.name}</p>
      )}

      {pitch.note && (
        <SharkBadge variant="warning" size="sm" className="mt-2">{pitch.note}</SharkBadge>
      )}
    </motion.div>
  )
}
