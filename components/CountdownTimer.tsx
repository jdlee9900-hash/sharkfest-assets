'use client'

import { useState, useEffect } from 'react'

const TARGET = new Date('2028-05-26T12:00:00')

function calc() {
  const diff = TARGET.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  }
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="countdown-unit">
      <span className="countdown-value">{String(value).padStart(2, '0')}</span>
      <span className="countdown-label">{label}</span>
    </div>
  )
}

export function CountdownTimer() {
  const [time, setTime] = useState<ReturnType<typeof calc> | null>(null)

  useEffect(() => {
    setTime(calc())
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!time) {
    return (
      <div className="countdown" aria-label="Loading countdown">
        {['days','hrs','min','sec'].map(l => (
          <div key={l} className="countdown-unit">
            <span className="countdown-value">--</span>
            <span className="countdown-label">{l}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="countdown" aria-label="Time until SharkFest 2028">
      <Unit value={time.days}    label="days" />
      <span className="countdown-sep" aria-hidden="true">:</span>
      <Unit value={time.hours}   label="hrs" />
      <span className="countdown-sep" aria-hidden="true">:</span>
      <Unit value={time.minutes} label="min" />
      <span className="countdown-sep" aria-hidden="true">:</span>
      <Unit value={time.seconds} label="sec" />
    </div>
  )
}
