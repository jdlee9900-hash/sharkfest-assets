import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkEventCard } from './SharkEventCard'

const meta: Meta<typeof SharkEventCard> = {
  title: 'Schedule/SharkEventCard',
  component: SharkEventCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6 bg-[#fafaf9]"><Story /></div>],
}
export default meta
type Story = StoryObj<typeof SharkEventCard>

const baseEvent = {
  id: '1',
  title: 'Main Stage Headliner',
  subtitle: 'The biggest set of the weekend',
  location: 'Main Stage',
  category: 'music',
  startTime: new Date(Date.now() - 1800000),
  endTime: new Date(Date.now() + 1800000),
}

export const Current: Story = { args: { event: baseEvent, status: 'current' } }
export const UpcomingSoon: Story = { args: { event: { ...baseEvent, id: '2', title: 'DJ Night', category: 'dj', startTime: new Date(Date.now() + 1200000), endTime: new Date(Date.now() + 5400000) }, status: 'upcoming-soon' } }
export const Upcoming: Story = { args: { event: { ...baseEvent, id: '3', title: 'Rugby Final', category: 'rugby', startTime: new Date(Date.now() + 7200000), endTime: new Date(Date.now() + 10800000) }, status: 'upcoming' } }
export const Past: Story = { args: { event: { ...baseEvent, id: '4', startTime: new Date(Date.now() - 7200000), endTime: new Date(Date.now() - 3600000) }, status: 'past' } }
