'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { SharkButton } from '../../primitives/SharkButton/SharkButton'
import { cn } from '@/utils'

export interface NavLink {
  label: string
  href: string
}

export interface SharkNavbarProps {
  links?: NavLink[]
  logoSrc?: string
  onRegister?: () => void
  className?: string
}

const defaultLinks: NavLink[] = [
  { label: 'Event info',  href: '#event-info' },
  { label: 'Programme',   href: '#programme' },
  { label: 'Pitches',     href: '#pitches' },
  { label: 'Gallery',     href: '#gallery' },
  { label: 'FAQs',        href: '#faqs' },
]

export function SharkNavbar({ links = defaultLinks, logoSrc, onRegister, className }: SharkNavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          scrolled
            ? 'bg-white/90 backdrop-blur-[12px] border-b border-[#e2e8f0] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
            : 'bg-transparent',
          className,
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-[1000px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(251,191,36,0.4)] rounded-[4px]">
            {logoSrc ? (
              <img src={logoSrc} alt="SharkFest 2028" className="h-9 w-auto object-contain" />
            ) : (
              <span className={cn('font-display text-xl tracking-wide', scrolled ? 'text-[#0f172a]' : 'text-white')}>
                SharkFest 2028
              </span>
            )}
          </a>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-1" role="list">
            {links.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={cn(
                    'px-3 py-2 rounded-[6px] text-sm font-body font-medium transition-colors duration-150',
                    'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(251,191,36,0.4)]',
                    scrolled
                      ? 'text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
                      : 'text-white/80 hover:text-white hover:bg-white/10',
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <SharkButton
              variant="primary"
              size="sm"
              onClick={onRegister}
              className={!scrolled ? '!bg-[#fbbf24] !text-[#0f172a] hover:!bg-[#f59e0b]' : ''}
            >
              Register
            </SharkButton>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-[8px] transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen
              ? <X className={cn('w-5 h-5', scrolled ? 'text-[#0f172a]' : 'text-white')} />
              : <Menu className={cn('w-5 h-5', scrolled ? 'text-[#0f172a]' : 'text-white')} />}
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-y-0 right-0 z-50 w-72 bg-[#0f172a] shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-white/10">
              <span className="font-display text-white text-xl">SharkFest 2028</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="flex flex-col p-4 gap-1 flex-1" role="list">
              {links.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-[10px] text-white/80 hover:text-white hover:bg-white/10 font-body text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="p-4 border-t border-white/10">
              <SharkButton variant="accent" size="md" fullWidth onClick={onRegister}>
                Register now
              </SharkButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
