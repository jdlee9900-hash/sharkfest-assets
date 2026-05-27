'use client'

import { useRef, ReactNode } from 'react'
import { useOceanCanvas } from '@/hooks/useOceanCanvas'
import { cn } from '@/utils'

export interface HeroStat {
  label: string
  value: string
}

export interface SharkHeroBannerProps {
  /** Main hero headline (displayed in Bebas Neue) */
  title: string
  /** Supporting subtitle */
  subtitle?: string
  /** Small-caps eyebrow label above the title */
  eyebrow?: string
  /** Glassmorphism stat pills */
  stats?: HeroStat[]
  /** CTA area */
  children?: ReactNode
  className?: string
}

export function SharkHeroBanner({ title, subtitle, eyebrow, stats, children, className }: SharkHeroBannerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useOceanCanvas(canvasRef)

  return (
    <section
      className={cn(
        'relative w-full min-h-screen flex items-center justify-center overflow-hidden',
        'bg-[#0f172a]',
        className
      )}
    >
      {/* Animated canvas background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1e]/80 via-transparent to-[#0a0f1e]/60" aria-hidden />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {eyebrow && (
          <p className="text-[#fbbf24] font-display text-xs tracking-[0.25em] uppercase mb-6">
            {eyebrow}
          </p>
        )}

        <h1
          className="font-display text-white leading-none tracking-[-0.01em] mb-6"
          style={{
            fontSize: 'clamp(4rem, 12vw, 8rem)',
            backgroundImage: 'linear-gradient(90deg, #ffffff 0%, #fbbf24 30%, #ffffff 60%, #fbbf24 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 5s linear infinite',
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="text-[#94a3b8] font-body text-lg md:text-xl leading-relaxed mb-8 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}

        {stats && stats.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white/[0.08] backdrop-blur-[12px] border border-white/[0.12] rounded-full px-5 py-2 flex items-center gap-2"
              >
                <span className="font-display text-[#fbbf24] text-lg">{stat.value}</span>
                <span className="text-white/70 text-sm font-body">{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {children && <div className="flex flex-wrap gap-3 justify-center">{children}</div>}
      </div>
    </section>
  )
}
