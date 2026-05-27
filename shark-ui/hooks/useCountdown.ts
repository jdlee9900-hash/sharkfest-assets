'use client'

import { useState, useEffect } from 'react'
import { msToDuration } from '@/utils'

export function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const ms = Math.max(0, targetDate.getTime() - Date.now())
    return msToDuration(ms)
  })

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, targetDate.getTime() - Date.now())
      setTimeLeft(msToDuration(ms))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return timeLeft
}
