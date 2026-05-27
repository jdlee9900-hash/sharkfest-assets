'use client'

import { useRef } from 'react'
import { cn } from '@/utils'

export interface QuickLink {
  label: string
  href?: string
  onClick?: () => void
  active?: boolean
}

export interface SharkQuickLinksProps {
  links: QuickLink[]
  className?: string
}

export function SharkQuickLinks({ links, className }: SharkQuickLinksProps) {
  return (
    <nav
      className={cn('bg-[#0f172a] border-b border-white/10 overflow-x-auto scrollbar-none', className)}
      aria-label="Quick links"
    >
      <div className="flex gap-1 px-4 py-2 max-w-[1000px] mx-auto min-w-max">
        {links.map((link, i) => {
          const Tag = link.href ? 'a' : 'button'
          return (
            // @ts-ignore
            <Tag
              key={i}
              href={link.href}
              onClick={link.onClick}
              className={cn(
                'relative px-4 py-2 rounded-full text-sm font-body font-medium transition-all duration-200 whitespace-nowrap',
                'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(251,191,36,0.4)]',
                link.active
                  ? 'bg-[#fbbf24] text-[#0f172a]'
                  : 'text-white/70 hover:text-white hover:bg-white/10',
                'group overflow-hidden',
              )}
            >
              {/* Shine sweep */}
              <span
                className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                aria-hidden
              />
              {link.label}
            </Tag>
          )
        })}
      </div>
    </nav>
  )
}
