'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils'

export interface AccordionItem {
  question: string
  answer: string
  category?: string
}

export interface SharkAccordionProps {
  items: AccordionItem[]
  /** Allow multiple panels open simultaneously */
  allowMultiple?: boolean
  className?: string
}

export function SharkAccordion({ items, allowMultiple = false, className }: SharkAccordionProps) {
  const [open, setOpen] = useState<Set<number>>(new Set())

  function toggle(i: number) {
    setOpen(prev => {
      const next = new Set(allowMultiple ? prev : [])
      if (prev.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item, i) => (
        <div key={i} className="border border-[#e2e8f0] rounded-[12px] overflow-hidden bg-white">
          <button
            onClick={() => toggle(i)}
            aria-expanded={open.has(i)}
            className={cn(
              'w-full flex items-center justify-between px-5 py-4 text-left',
              'font-body font-semibold text-sm text-[#0f172a]',
              'hover:bg-[#f8fafc] transition-colors duration-150',
              'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(251,191,36,0.4)] focus-visible:outline-offset-[-3px]',
            )}
          >
            <span>{item.question}</span>
            <motion.span
              animate={{ rotate: open.has(i) ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-4 flex-none text-[#94a3b8]"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {open.has(i) && (
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 text-sm text-[#64748b] leading-relaxed border-t border-[#f1f5f9] pt-4">
                  {item.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
