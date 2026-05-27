import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkTimeline } from './SharkTimeline'

const meta: Meta<typeof SharkTimeline> = {
  title: 'Schedule/SharkTimeline',
  component: SharkTimeline,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6 bg-[#fafaf9]"><Story /></div>],
}
export default meta
type Story = StoryObj<typeof SharkTimeline>

const now = new Date()
const events = [
  { id: '1', title: 'Opening Ceremony', location: 'Main Stage', category: 'general', startTime: new Date(now.getTime() - 7200000), endTime: new Date(now.getTime() - 5400000) },
  { id: '2', title: 'Main Stage Headliner', subtitle: 'The biggest set of the weekend', location: 'Main Stage', category: 'music', startTime: new Date(now.getTime() - 1800000), endTime: new Date(now.getTime() + 1800000) },
  { id: '3', title: 'DJ Night', location: 'Lakeside', category: 'dj', startTime: new Date(now.getTime() + 3600000), endTime: new Date(now.getTime() + 7200000) },
  { id: '4', title: 'Rugby Final', location: 'Main Pitch', category: 'rugby', startTime: new Date(now.getTime() + 10800000), endTime: new Date(now.getTime() + 14400000) },
]

export const Default: Story = { args: { events, phase: 'live' } }
