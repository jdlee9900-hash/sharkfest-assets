'use client'

import { useState, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils'

export type TabVariant = 'underline' | 'pill' | 'card'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

export interface SharkTabsProps {
  items: TabItem[]
  variant?: TabVariant
  defaultTab?: string
  className?: string
}

export function SharkTabs({ items, variant = 'underline', defaultTab, className }: SharkTabsProps) {
  const [active, setActive] = useState(defaultTab ?? items[0]?.id)
  const activeItem = items.find(t => t.id === active)

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'flex gap-1',
          variant === 'underline' && 'border-b border-[#e2e8f0]',
          variant === 'pill' && 'bg-[#f1f5f9] rounded-[8px] p-1',
          variant === 'card' && 'gap-2',
        )}
        role="tablist"
      >
        {items.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={cn(
              'relative font-body font-medium text-sm px-4 py-2.5 transition-colors duration-200',
              'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(251,191,36,0.4)] focus-visible:rounded-[6px]',
              variant === 'underline' && cn(
                'text-[#64748b] hover:text-[#0f172a] rounded-t-[4px]',
                active === tab.id && 'text-[#0f172a]',
              ),
              variant === 'pill' && cn(
                'rounded-[6px] text-[#64748b] hover:text-[#0f172a] flex-1 text-center',
                active === tab.id && 'text-[#0f172a]',
              ),
              variant === 'card' && cn(
                'rounded-[8px] border text-[#64748b]',
                active === tab.id
                  ? 'bg-[#0f172a] text-white border-[#0f172a]'
                  : 'bg-white border-[#e2e8f0] hover:bg-[#f8fafc]',
              ),
            )}
          >
            {active === tab.id && variant === 'underline' && (
              <motion.span
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0f172a]"
              />
            )}
            {active === tab.id && variant === 'pill' && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 bg-white rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`tabpanel-${active}`}
        className="mt-4"
      >
        {activeItem?.content}
      </div>
    </div>
  )
}
