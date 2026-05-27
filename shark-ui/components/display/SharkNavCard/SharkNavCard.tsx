'use client'

import { useRef, MouseEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { cn } from '@/utils'

export interface SharkNavCardProps {
  /** Category/section tag (e.g. "PROGRAMME") */
  tag: string
  /** Card heading */
  title: string
  /** Supporting description */
  description: string
  /** Link target */
  href?: string
  /** Number displayed in ghost text behind content (e.g. "01") */
  number?: string
  /** Accent bar colour */
  accentColor?: string
  /** Called on click */
  onClick?: () => void
  className?: string
}

const cardClass = (className?: string) =>
  cn(
    'group relative bg-white border border-[#e2e8f0] rounded-[16px] p-6 overflow-hidden cursor-pointer',
    'shadow-[0_1px_4px_rgba(0,0,0,0.06)]',
    'transition-all duration-[250ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]',
    'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]',
    'block',
    className,
  )

function CardInner({ number, accentColor, tag, title, description }: Pick<SharkNavCardProps, 'number' | 'accentColor' | 'tag' | 'title' | 'description'>) {
  return (
    <>
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[16px] pointer-events-none"
        style={{ background: 'radial-gradient(200px circle at var(--mx, 50%) var(--my, 50%), rgba(251,191,36,0.06), transparent)' }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-[350ms] ease-[cubic-bezier(0,0,0.2,1)]"
        style={{ backgroundColor: accentColor }}
      />
      {number && (
        <span className="absolute right-4 top-2 font-display text-[#0f172a] leading-none select-none pointer-events-none" style={{ fontSize: '5rem', opacity: 0.04 }} aria-hidden>
          {number}
        </span>
      )}
      <span className="font-display text-[11px] tracking-[0.25em] text-[#94a3b8] uppercase block mb-2">{tag}</span>
      <h3 className="font-display text-[#0f172a] mb-2" style={{ fontSize: '1.75rem', lineHeight: 1 }}>{title}</h3>
      <p className="text-sm text-[#64748b] font-body leading-snug max-w-[90%]">{description}</p>
      <div className={cn('absolute right-4 bottom-4 w-8 h-8 rounded-full flex items-center justify-center', 'bg-[#f1f5f9] text-[#0f172a]', 'transition-all duration-200', 'group-hover:bg-[#fbbf24] group-hover:rotate-[-45deg]')}>
        <ArrowRight className="w-4 h-4" />
      </div>
    </>
  )
}

export function SharkNavCard({ tag, title, description, href, number, accentColor = '#fbbf24', onClick, className }: SharkNavCardProps) {
  const { ref, isInView } = useScrollAnimation()
  const cardRef = useRef<HTMLElement>(null)

  function handleMouseMove(e: MouseEvent<HTMLElement>) {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    card.style.setProperty('--mx', `${x}%`)
    card.style.setProperty('--my', `${y}%`)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
    >
      {href ? (
        <a
          ref={cardRef as React.RefObject<HTMLAnchorElement>}
          href={href}
          onClick={onClick}
          onMouseMove={handleMouseMove}
          className={cardClass(className)}
        >
          <CardInner number={number} accentColor={accentColor} tag={tag} title={title} description={description} />
        </a>
      ) : (
        <div
          ref={cardRef as React.RefObject<HTMLDivElement>}
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() }}
          onMouseMove={handleMouseMove}
          className={cardClass(className)}
        >
          <CardInner number={number} accentColor={accentColor} tag={tag} title={title} description={description} />
        </div>
      )}
    </motion.div>
  )
}
