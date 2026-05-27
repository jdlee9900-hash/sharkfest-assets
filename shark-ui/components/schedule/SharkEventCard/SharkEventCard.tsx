'use client'

import { motion } from 'framer-motion'
import { Clock, MapPin } from 'lucide-react'
import { SharkBadge } from '../../primitives/SharkBadge/SharkBadge'
import { ScheduleEvent, EventStatus, getEventProgress, formatTime } from '@/utils'
import { cn } from '@/utils'

export interface SharkEventCardProps {
  event: ScheduleEvent
  status: EventStatus
  className?: string
}

const categoryToBadgeVariant: Record<string, import('../../primitives/SharkBadge/SharkBadge').BadgeVariant> = {
  music:    'cat-music',
  dj:       'cat-dj',
  rugby:    'cat-rugby',
  food:     'cat-food',
  bar:      'cat-bar',
  wellness: 'cat-wellness',
  kids:     'cat-kids',
  general:  'cat-general',
}

export function SharkEventCard({ event, status, className }: SharkEventCardProps) {
  const progress = status === 'current' ? getEventProgress(event) : 0
  const badgeVariant = categoryToBadgeVariant[event.category] ?? 'cat-general'

  return (
    <div className={cn('flex gap-4', status === 'past' && 'opacity-40', className)}>
      {/* Time column */}
      <div className="w-14 flex-none text-right pt-3.5">
        <span className="font-mono text-xs text-[#94a3b8]">{formatTime(event.startTime)}</span>
      </div>

      {/* Dot */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-3 h-3 rounded-full mt-3.5 flex-none border-2',
            status === 'current'
              ? 'bg-[#fbbf24] border-[#fbbf24] shadow-[0_0_0_4px_rgba(251,191,36,0.2)]'
              : status === 'upcoming-soon'
              ? 'bg-white border-[#fbbf24]'
              : status === 'past'
              ? 'bg-[#e2e8f0] border-[#e2e8f0]'
              : 'bg-white border-[#cbd5e1]',
          )}
        />
        <div className="flex-1 w-px bg-[#e2e8f0] mt-1" />
      </div>

      {/* Card */}
      <motion.div
        whileHover={{ y: -1 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'flex-1 mb-3 rounded-[12px] p-4 border',
          status === 'current'
            ? 'bg-amber-50 border-amber-200'
            : status === 'upcoming-soon'
            ? 'bg-white border-[#fbbf24]/30 shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
            : 'bg-white border-[#e2e8f0]',
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-body font-semibold text-[#0f172a] text-sm leading-tight">{event.title}</p>
            {event.subtitle && <p className="text-xs text-[#94a3b8] mt-0.5 font-accent italic">{event.subtitle}</p>}
          </div>
          <div className="flex flex-col items-end gap-1 flex-none">
            {status === 'current' && <SharkBadge variant="live" dot pulse size="sm">LIVE</SharkBadge>}
            {status === 'upcoming-soon' && <SharkBadge variant="soon" dot size="sm">SOON</SharkBadge>}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(event.startTime)} – {formatTime(event.endTime)}
          </span>
          <SharkBadge variant={badgeVariant} size="sm">{event.category}</SharkBadge>
        </div>

        {status === 'current' && (
          <div className="mt-3 h-1 bg-amber-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#fbbf24] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </motion.div>
    </div>
  )
}
