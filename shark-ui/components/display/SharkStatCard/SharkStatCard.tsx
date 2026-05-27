'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { cn } from '@/utils'

export interface SharkStatCardProps {
  /** The numeric or text value to display prominently */
  value: string
  /** Unit label (e.g. "acts", "km") */
  unit?: string
  /** Descriptive label beneath the value */
  label: string
  /** Colour for the animated top border */
  accentColor?: string
  className?: string
}

export function SharkStatCard({ value, unit, label, accentColor = '#fbbf24', className }: SharkStatCardProps) {
  const { ref, isInView } = useScrollAnimation()

  return (
    <div ref={ref} className={cn('relative bg-white rounded-[12px] border border-[#e2e8f0] p-6 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]', className)}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.5, ease: [0, 0, 0.2, 1], delay: 0.1 }}
        className="absolute top-0 left-0 right-0 h-[3px] origin-left"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-[#0f172a]" style={{ fontSize: '2.5rem', lineHeight: 0.95 }}>
          {value}
        </span>
        {unit && <span className="text-sm font-body text-[#94a3b8]">{unit}</span>}
      </div>
      <p className="mt-1 text-sm font-body text-[#64748b]">{label}</p>
    </div>
  )
}
