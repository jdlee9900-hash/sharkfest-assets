'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCountdown } from '@/hooks/useCountdown'
import { padZero } from '@/utils'
import { cn } from '@/utils'

export interface SharkCountdownProps {
  /** Target date/time for the countdown */
  targetDate: Date
  className?: string
}

function FlipDigit({ value, label }: { value: number; label: string }) {
  const display = padZero(value)
  const [prev, setPrev] = useState(display)
  const [flip, setFlip] = useState(false)

  useEffect(() => {
    if (display !== prev) {
      setFlip(true)
      const t = setTimeout(() => {
        setPrev(display)
        setFlip(false)
      }, 350)
      return () => clearTimeout(t)
    }
  }, [display, prev])

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-16 h-20 rounded-[12px] bg-white/[0.08] backdrop-blur-[12px] border border-white/[0.12] flex items-center justify-center overflow-hidden"
        style={{ perspective: '200px' }}
      >
        <motion.span
          key={prev}
          animate={flip ? { rotateX: [-0, -90] } : { rotateX: 0 }}
          transition={{ duration: 0.175, ease: 'easeIn' }}
          className="absolute font-display text-white text-4xl"
          style={{ lineHeight: 1 }}
        >
          {prev}
        </motion.span>
        <motion.span
          key={display + '-in'}
          initial={{ rotateX: 90 }}
          animate={flip ? { rotateX: 0 } : { rotateX: 90 }}
          transition={{ duration: 0.175, ease: 'easeOut', delay: 0.175 }}
          className="absolute font-display text-white text-4xl"
          style={{ lineHeight: 1 }}
        >
          {display}
        </motion.span>
      </div>
      <span className="font-body text-xs text-white/50 uppercase tracking-[0.15em]">{label}</span>
    </div>
  )
}

export function SharkCountdown({ targetDate, className }: SharkCountdownProps) {
  const { days, hours, minutes, seconds } = useCountdown(targetDate)

  return (
    <div className={cn('flex gap-3 items-end', className)}>
      <FlipDigit value={days}    label="Days" />
      <span className="font-display text-white/40 text-3xl mb-8">:</span>
      <FlipDigit value={hours}   label="Hrs" />
      <span className="font-display text-white/40 text-3xl mb-8">:</span>
      <FlipDigit value={minutes} label="Min" />
      <span className="font-display text-white/40 text-3xl mb-8">:</span>
      <FlipDigit value={seconds} label="Sec" />
    </div>
  )
}
