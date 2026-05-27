'use client'

import { forwardRef, InputHTMLAttributes, ReactNode, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils'

export type InputVariant = 'default' | 'search'

export interface SharkInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Visual style */
  variant?: InputVariant
  /** Field label */
  label?: string
  /** Helper text beneath the field */
  hint?: string
  /** Error message — also triggers error styling */
  error?: string
  /** Icon on the left inside the input */
  leftIcon?: ReactNode
  /** Icon on the right inside the input */
  rightIcon?: ReactNode
  /** Show a clear button when input has content */
  clearable?: boolean
  /** Called when the clear button is clicked */
  onClear?: () => void
}

export const SharkInput = forwardRef<HTMLInputElement, SharkInputProps>(function SharkInput(
  { variant = 'default', label, hint, error, leftIcon, rightIcon, clearable, onClear, className, id, value, ...props },
  ref
) {
  const inputId = id ?? `shark-input-${Math.random().toString(36).slice(2)}`
  const hasValue = value !== undefined && value !== ''
  const hasError = Boolean(error)

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-[#0f172a] mb-1.5">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-[#94a3b8] flex items-center" aria-hidden>
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          value={value}
          className={cn(
            'w-full font-body text-sm text-[#0f172a] bg-white rounded-[8px] border',
            'py-2.5 pr-10',
            'placeholder:text-[#94a3b8]',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(251,191,36,0.4)] focus-visible:border-[#fbbf24]',
            leftIcon ? 'pl-10' : 'pl-3',
            hasError
              ? 'border-[#ef4444] focus-visible:ring-[rgba(239,68,68,0.3)] focus-visible:border-[#ef4444]'
              : 'border-[#e2e8f0] hover:border-[#94a3b8]',
            props.disabled && 'opacity-50 cursor-not-allowed bg-[#f8fafc]',
            className,
          )}
          aria-invalid={hasError}
          aria-describedby={
            [hint && `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean).join(' ') || undefined
          }
          {...props}
        />

        {clearable && hasValue && !props.disabled && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 text-[#94a3b8] hover:text-[#0f172a] transition-colors"
            aria-label="Clear input"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {rightIcon && !clearable && (
          <span className="absolute right-3 text-[#94a3b8]" aria-hidden>
            {rightIcon}
          </span>
        )}
      </div>

      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-[#64748b]">{hint}</p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-[#ef4444]" role="alert">{error}</p>
      )}
    </div>
  )
})
