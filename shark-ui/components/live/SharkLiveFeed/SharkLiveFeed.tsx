'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { SharkCountdown } from '../SharkCountdown/SharkCountdown'
import { SharkBadge } from '../../primitives/SharkBadge/SharkBadge'
import { useLiveFeed, FestivalPhase } from '@/hooks/useLiveFeed'
import { ScheduleEvent, getEventProgress, formatTime } from '@/utils'
import { cn } from '@/utils'

export interface SharkLiveFeedProps {
  events: ScheduleEvent[]
  festivalStart: Date
  festivalEnd: Date
  className?: string
}

function BeforeState({ festivalStart }: { festivalStart: Date }) {
  return (
    <div className="text-center py-8">
      <p className="font-body text-white/60 text-sm mb-2">Goes live</p>
      <p className="font-display text-white/90" style={{ fontSize: '1.25rem' }}>
        {festivalStart.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}, {formatTime(festivalStart)}
      </p>
      <div className="mt-6 flex justify-center">
        <SharkCountdown targetDate={festivalStart} />
      </div>
      <p className="mt-6 text-white/40 text-xs font-body">
        Until then, the countdown above is the only thing ticking down.
      </p>
    </div>
  )
}

function LiveState({ currentEvents, nextEvents, elapsed }: { currentEvents: ScheduleEvent[], nextEvents: ScheduleEvent[], elapsed: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <SharkBadge variant="live" dot pulse>LIVE</SharkBadge>
        <span className="font-mono text-white/60 text-sm">{elapsed} elapsed</span>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="font-display text-white/60 text-xs tracking-[0.2em] uppercase mb-3">Happening now</p>
          {currentEvents.length === 0 ? (
            <p className="text-white/40 text-sm">Nothing scheduled right now.</p>
          ) : currentEvents.map(e => (
            <EventRow key={e.id} event={e} current />
          ))}
        </div>
        <div>
          <p className="font-display text-white/60 text-xs tracking-[0.2em] uppercase mb-3">Coming next</p>
          {nextEvents.length === 0 ? (
            <p className="text-white/40 text-sm">That&apos;s all for today.</p>
          ) : nextEvents.map(e => (
            <EventRow key={e.id} event={e} />
          ))}
        </div>
      </div>
    </div>
  )
}

function EventRow({ event, current }: { event: ScheduleEvent, current?: boolean }) {
  const progress = current ? getEventProgress(event) : 0
  return (
    <div className={cn('mb-3 rounded-[10px] p-3 border', current ? 'bg-amber-500/10 border-amber-400/30' : 'bg-white/[0.04] border-white/[0.08]')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-body font-semibold text-white text-sm">{event.title}</p>
          {event.location && <p className="text-white/50 text-xs mt-0.5">{event.location}</p>}
        </div>
        <span className="font-mono text-xs text-white/60 flex-none">{formatTime(event.startTime)}</span>
      </div>
      {current && (
        <div className="mt-2 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#fbbf24] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}

function AfterState() {
  return (
    <div className="text-center py-8">
      <p className="font-display text-white" style={{ fontSize: '2rem', lineHeight: 1 }}>See you at SharkFest 2030</p>
      <p className="mt-3 text-white/50 font-body text-sm">Thanks for an incredible three days.</p>
    </div>
  )
}

export function SharkLiveFeed({ events, festivalStart, festivalEnd, className }: SharkLiveFeedProps) {
  const { phase, currentEvents, nextEvents, elapsed } = useLiveFeed(events, festivalStart, festivalEnd)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'bg-white/[0.08] backdrop-blur-[12px] border border-white/[0.12] rounded-[24px] p-6',
        className
      )}
    >
      {phase === 'before' && <BeforeState festivalStart={festivalStart} />}
      {phase === 'live'   && <LiveState currentEvents={currentEvents} nextEvents={nextEvents} elapsed={elapsed} />}
      {phase === 'after'  && <AfterState />}
    </motion.div>
  )
}
