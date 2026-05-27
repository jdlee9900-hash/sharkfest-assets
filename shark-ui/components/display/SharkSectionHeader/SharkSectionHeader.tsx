'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { cn } from '@/utils'

export interface SharkSectionHeaderProps {
  /** Small-caps eyebrow above the title */
  eyebrow?: string
  /** Main section heading */
  title: string
  /** Supporting text beneath the title */
  subtitle?: string
  /** Alignment of all text */
  align?: 'left' | 'center'
  className?: string
}

export function SharkSectionHeader({ eyebrow, title, subtitle, align = 'center', className }: SharkSectionHeaderProps) {
  const { ref, isInView } = useScrollAnimation()

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
      className={cn(
        'mb-12',
        align === 'center' && 'text-center',
        className
      )}
    >
      {eyebrow && (
        <div className={cn('flex items-center gap-3 mb-3', align === 'center' && 'justify-center')}>
          <span className="h-px w-8 bg-[#fbbf24]" />
          <span className="font-display text-xs tracking-[0.25em] text-[#64748b] uppercase">
            {eyebrow}
          </span>
          <span className="h-px w-8 bg-[#fbbf24]" />
        </div>
      )}
      <h2 className="font-display text-[#0f172a]" style={{ fontSize: '3.5rem', lineHeight: 0.92 }}>
        {title}
      </h2>
      {subtitle && (
        <p className={cn('mt-3 font-body text-[#64748b] text-lg leading-relaxed max-w-2xl', align === 'center' && 'mx-auto')}>
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
