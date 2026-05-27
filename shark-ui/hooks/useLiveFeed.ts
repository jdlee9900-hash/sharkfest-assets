'use client'

import { useState, useEffect } from 'react'
import { ScheduleEvent, getEventStatus, EventStatus } from '@/utils'

export type FestivalPhase = 'before' | 'live' | 'after'

interface LiveFeedState {
  phase: FestivalPhase
  now: Date
  currentEvents: ScheduleEvent[]
  nextEvents: ScheduleEvent[]
  elapsed: string
}

export function useLiveFeed(
  events: ScheduleEvent[],
  festivalStart: Date,
  festivalEnd: Date
): LiveFeedState {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const phase: FestivalPhase =
    now < festivalStart ? 'before' :
    now > festivalEnd   ? 'after'  : 'live'

  const currentEvents = events.filter(e => getEventStatus(e, now) === 'current')
  const nextEvents = events
    .filter(e => getEventStatus(e, now) === 'upcoming' || getEventStatus(e, now) === 'upcoming-soon')
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 3)

  const elapsedMs = Math.max(0, now.getTime() - festivalStart.getTime())
  const elapsedH = Math.floor(elapsedMs / 3600000)
  const elapsedM = Math.floor((elapsedMs % 3600000) / 60000)
  const elapsed = `${String(elapsedH).padStart(2,'0')}:${String(elapsedM).padStart(2,'0')}`

  return { phase, now, currentEvents, nextEvents, elapsed }
}
