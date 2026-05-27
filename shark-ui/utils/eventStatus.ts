export type EventStatus = 'past' | 'current' | 'upcoming-soon' | 'upcoming'

export interface ScheduleEvent {
  id: string
  title: string
  subtitle?: string
  location?: string
  category: string
  startTime: Date
  endTime: Date
  icon?: string
}

export function getEventStatus(event: ScheduleEvent, now: Date = new Date()): EventStatus {
  if (now > event.endTime) return 'past'
  if (now >= event.startTime && now <= event.endTime) return 'current'
  const minutesUntilStart = (event.startTime.getTime() - now.getTime()) / 60000
  if (minutesUntilStart <= 30) return 'upcoming-soon'
  return 'upcoming'
}

export function getEventProgress(event: ScheduleEvent, now: Date = new Date()): number {
  const total = event.endTime.getTime() - event.startTime.getTime()
  const elapsed = now.getTime() - event.startTime.getTime()
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}
