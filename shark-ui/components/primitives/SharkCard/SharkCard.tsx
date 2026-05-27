'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils'

export type CardVariant = 'default' | 'elevated' | 'outline' | 'dark' | 'glass'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface SharkCardProps {
  /** Visual style */
  variant?: CardVariant
  /** Optional accent stripe colour */
  accent?: string
  /** Position of accent stripe */
  accentPosition?: 'top' | 'left'
  /** Enable hover lift effect */
  hover?: boolean
  /** Internal padding preset */
  padding?: CardPadding
  children: ReactNode
  className?: string
  onClick?: () => void
}

const variantBase: Record<CardVariant, string> = {
  default:  'bg-white border border-[#e2e8f0] shadow-[0_1px_4px_rgba(0,0,0,0.06)]',
  elevated: 'bg-white border-0 shadow-[0_8px_24px_rgba(0,0,0,0.10)]',
  outline:  'bg-transparent border border-[#e2e8f0]',
  dark:     'bg-[#0f172a] border border-[rgba(255,255,255,0.08)] text-white',
  glass:    'bg-white/[0.08] backdrop-blur-[12px] border border-white/[0.12] text-white',
}

const paddingClass: Record<CardPadding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}

export function SharkCard({ variant = 'default', accent, accentPosition = 'top', hover, padding = 'md', children, className, onClick }: SharkCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { y: -2 } : {}}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'relative rounded-[12px] overflow-hidden',
        variantBase[variant],
        paddingClass[padding],
        hover && 'cursor-pointer',
        hover && variant === 'default' && 'hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]',
        className,
      )}
    >
      {accent && accentPosition === 'top' && (
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: accent }} />
      )}
      {accent && accentPosition === 'left' && (
        <div className="absolute top-0 left-0 bottom-0 w-[3px]" style={{ backgroundColor: accent }} />
      )}
      {children}
    </motion.div>
  )
}
