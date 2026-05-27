'use client'

import { useRef, useEffect, useState } from 'react'

interface Props {
  value: number
  label: string
  prefix?: string
  suffix?: string
  duration?: number
}

export function AnimatedCounter({ value, label, prefix = '', suffix = '', duration = 1800 }: Props) {
  const ref  = useRef<HTMLDivElement>(null)
  const [display, setDisplay] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect() } },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      // ease out expo
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setDisplay(Math.round(eased * value))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, value, duration])

  return (
    <div ref={ref} className="stat-counter">
      <div className="stat-counter-value">
        {prefix}{display.toLocaleString()}{suffix}
      </div>
      <div className="stat-counter-label">{label}</div>
    </div>
  )
}
