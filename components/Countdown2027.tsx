'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// May Bank Holiday weekend — gates open Friday 28 May 2027
const TARGET = new Date('2027-05-28T16:00:00')

function pad(n: number) { return String(n).padStart(2, '0') }

function calc() {
  const diff = TARGET.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000)  / 60_000),
    seconds: Math.floor((diff % 60_000)     / 1_000),
  }
}

function FlipUnit({ value, label }: { value: number; label: string }) {
  const display = pad(value)
  const [prev, setPrev] = useState(display)
  const [flip, setFlip] = useState(false)

  useEffect(() => {
    if (display !== prev) {
      setFlip(true)
      const t = setTimeout(() => { setPrev(display); setFlip(false) }, 350)
      return () => clearTimeout(t)
    }
  }, [display, prev])

  return (
    <div className="flip-unit">
      <div className="f27-flip-card" style={{ perspective: '240px' }}>
        <motion.span
          key={prev}
          animate={flip ? { rotateX: [0, -90] } : { rotateX: 0 }}
          transition={{ duration: 0.175, ease: 'easeIn' }}
          className="f27-flip-digit"
        >
          {prev}
        </motion.span>
        <motion.span
          key={display + '-in'}
          initial={{ rotateX: 90 }}
          animate={flip ? { rotateX: 0 } : { rotateX: 90 }}
          transition={{ duration: 0.175, ease: 'easeOut', delay: 0.175 }}
          className="f27-flip-digit"
        >
          {display}
        </motion.span>
        <div className="flip-line" aria-hidden="true" />
      </div>
      <span className="f27-flip-label">{label}</span>
    </div>
  )
}

export function Countdown2027() {
  const [time, setTime] = useState<ReturnType<typeof calc> | null>(null)

  useEffect(() => {
    setTime(calc())
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  }, [])

  const skeleton = ['days', 'hrs', 'min', 'sec']

  if (!time) return (
    <div className="countdown" aria-label="Loading countdown">
      {skeleton.map(l => (
        <div key={l} className="flip-unit">
          <div className="f27-flip-card"><span className="f27-flip-digit">--</span></div>
          <span className="f27-flip-label">{l}</span>
        </div>
      ))}
    </div>
  )

  return (
    <div className="countdown" aria-label="Time until SharkFest 2027">
      <FlipUnit value={time.days}    label="days" />
      <span className="f27-countdown-sep" aria-hidden>:</span>
      <FlipUnit value={time.hours}   label="hrs" />
      <span className="f27-countdown-sep" aria-hidden>:</span>
      <FlipUnit value={time.minutes} label="min" />
      <span className="f27-countdown-sep" aria-hidden>:</span>
      <FlipUnit value={time.seconds} label="sec" />
    </div>
  )
}
