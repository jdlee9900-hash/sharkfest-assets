'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'strava'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface SharkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style */
  variant?: ButtonVariant
  /** Size preset */
  size?: ButtonSize
  /** Icon before the label */
  leftIcon?: ReactNode
  /** Icon after the label */
  rightIcon?: ReactNode
  /** Full-width layout */
  fullWidth?: boolean
  /** Show loading spinner */
  loading?: boolean
  /** Text to show while loading (falls back to children) */
  loadingText?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-[#0f172a] text-white hover:bg-[#1e293b] border border-transparent',
  secondary: 'bg-white text-[#0f172a] border border-[#0f172a] hover:bg-[#f8fafc]',
  ghost:     'bg-transparent text-[#0f172a] border border-transparent hover:bg-[#f1f5f9]',
  danger:    'bg-[#ef4444] text-white border border-transparent hover:bg-[#dc2626]',
  accent:    'bg-[#fbbf24] text-[#0f172a] border border-transparent hover:bg-[#f59e0b] shadow-[0_4px_20px_rgba(251,191,36,0.25)]',
  strava:    'bg-[#fc5200] text-white border border-transparent hover:bg-[#e34b00]',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs:  'h-7 px-2.5 text-xs gap-1.5',
  sm:  'h-8 px-3.5 text-[13px] gap-1.5',
  md:  'h-10 px-5 text-sm gap-2',
  lg:  'h-11 px-6 text-[15px] gap-2',
  xl:  'h-14 px-8 text-base gap-2.5',
}

export const SharkButton = forwardRef<HTMLButtonElement, SharkButtonProps>(function SharkButton(
  { variant = 'primary', size = 'md', leftIcon, rightIcon, fullWidth, loading, loadingText, children, disabled, className, ...props },
  ref
) {
  const isDisabled = disabled || loading

  return (
    <motion.button
      ref={ref}
      whileTap={isDisabled ? {} : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center font-body font-semibold rounded-[8px]',
        'transition-colors duration-200',
        'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(251,191,36,0.4)] focus-visible:outline-offset-2',
        'disabled:bg-[#e2e8f0] disabled:text-[#94a3b8] disabled:cursor-not-allowed disabled:shadow-none disabled:border-transparent',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        loading && 'cursor-wait',
        className,
      )}
      {...(props as unknown as React.ComponentProps<typeof motion.button>)}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" style={{ width: size === 'xs' ? 12 : 14, height: size === 'xs' ? 12 : 14 }} aria-hidden />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </motion.button>
  )
})
