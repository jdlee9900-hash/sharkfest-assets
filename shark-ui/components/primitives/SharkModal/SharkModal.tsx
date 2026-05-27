'use client'

import { ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/utils'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'

export interface SharkModalProps {
  /** Is the modal visible */
  open: boolean
  /** Called when close is requested */
  onClose: () => void
  /** Modal heading */
  title?: string
  /** Supporting description below the heading */
  description?: string
  /** Bottom action area */
  footer?: ReactNode
  size?: ModalSize
  children?: ReactNode
  className?: string
}

const sizeClasses: Record<ModalSize, string> = {
  sm:         'max-w-sm',
  md:         'max-w-md',
  lg:         'max-w-lg',
  xl:         'max-w-2xl',
  fullscreen: 'max-w-none w-full h-full m-0 rounded-none',
}

export function SharkModal({ open, onClose, title, description, footer, size = 'md', children, className }: SharkModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal aria-labelledby={title ? 'modal-title' : undefined}>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[rgba(15,23,42,0.85)] backdrop-blur-[8px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
            className={cn(
              'relative z-10 bg-white rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.16)] w-full overflow-hidden',
              sizeClasses[size],
              className,
            )}
          >
            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between p-6 pb-0">
                <div>
                  {title && <h2 id="modal-title" className="font-display text-[#0f172a]" style={{ fontSize: '2rem', lineHeight: 1 }}>{title}</h2>}
                  {description && <p className="mt-2 text-sm text-[#64748b] font-body">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="ml-4 flex-none w-9 h-9 rounded-full flex items-center justify-center text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(251,191,36,0.4)]"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-6">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
