'use client'

import { useState } from 'react'
import { SharkEventCard } from '../SharkEventCard/SharkEventCard'
import { SharkNowMarker } from '../../live/SharkNowMarker/SharkNowMarker'
import { SharkTabs } from '../../primitives/SharkTabs/SharkTabs'
import { ScheduleEvent, getEventStatus } from '@/utils'
import { cn } from '@/utils'

export interface SharkTimelineProps {
  events: ScheduleEvent[]
  /** Festival phase — determines whether NOW marker is shown */
  phase?: 'before' | 'live' | 'after'
  className?: string
}

function groupByDay(events: ScheduleEvent[]) {
  const groups: Record<string, ScheduleEvent[]> = {}
  events.forEach(e => {
    const key = e.startTime.toDateString()
    ;(groups[key] ??= []).push(e)
  })
  return groups
}

function DayTimeline({ events, phase }: { events: ScheduleEvent[], phase?: 'before' | 'live' | 'after' }) {
  const now = new Date()
  const [showPast, setShowPast] = useState(true)
  const statused = events.map(e => ({ event: e, status: getEventStatus(e, now) }))
  const hasPast = statused.some(e => e.status === 'past')
  const nowIndex = phase === 'live' ? statused.findIndex(e => e.status === 'current' || e.status === 'upcoming-soon' || e.status === 'upcoming') : -1

  return (
    <div>
      {hasPast && (
        <button
          onClick={() => setShowPast(p => !p)}
          className="text-xs font-body text-[#94a3b8] hover:text-[#0f172a] mb-4 transition-colors"
        >
          {showPast ? 'Hide' : 'Show'} past events
        </button>
      )}
      <div>
        {statused.map(({ event, status }, i) => {
          if (!showPast && status === 'past') return null
          return (
            <div key={event.id}>
              {phase === 'live' && i === nowIndex && nowIndex > 0 && <SharkNowMarker />}
              <SharkEventCard event={event} status={status} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SharkTimeline({ events, phase, className }: SharkTimelineProps) {
  const grouped = groupByDay(events)
  const days = Object.entries(grouped)

  if (days.length === 0) {
    return <p className="text-sm text-[#94a3b8] text-center py-8">No events scheduled.</p>
  }

  if (days.length === 1) {
    return (
      <div className={cn('max-w-xl', className)}>
        <DayTimeline events={days[0][1]} phase={phase} />
      </div>
    )
  }

  const tabs = days.map(([dateStr, dayEvents]) => {
    const date = new Date(dateStr)
    const label = date.toLocaleDateString('en-GB', { weekday: 'short' })
    return {
      id: dateStr,
      label,
      content: <DayTimeline events={dayEvents} phase={phase} />,
    }
  })

  return (
    <div className={cn('max-w-xl', className)}>
      <SharkTabs items={tabs} variant="pill" />
    </div>
  )
}
