import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkLiveFeed } from './SharkLiveFeed'

const meta: Meta<typeof SharkLiveFeed> = {
  title: 'Live/SharkLiveFeed',
  component: SharkLiveFeed,
  parameters: { backgrounds: { default: 'navy' } },
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkLiveFeed>

const events = [
  { id: '1', title: 'Main Stage Opening', subtitle: 'Welcome set', location: 'Main Stage', category: 'music', startTime: new Date(Date.now() - 1800000), endTime: new Date(Date.now() + 1800000) },
  { id: '2', title: 'DJ Night', location: 'Lakeside Stage', category: 'dj', startTime: new Date(Date.now() + 3600000), endTime: new Date(Date.now() + 7200000) },
  { id: '3', title: 'Food Village', location: 'Village Square', category: 'food', startTime: new Date(Date.now() + 7200000), endTime: new Date(Date.now() + 10800000) },
]

export const BeforeState: Story = {
  args: { events: [], festivalStart: new Date('2028-05-26T12:00:00'), festivalEnd: new Date('2028-05-29T23:59:00') }
}

export const LiveState: Story = {
  args: {
    events,
    festivalStart: new Date(Date.now() - 3600000),
    festivalEnd: new Date(Date.now() + 86400000),
  },
  decorators: [(Story) => <div className="max-w-2xl mx-auto p-6 bg-[#1e293b]"><Story /></div>],
}
