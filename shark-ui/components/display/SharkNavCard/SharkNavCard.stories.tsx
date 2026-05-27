import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkNavCard } from './SharkNavCard'

const meta: Meta<typeof SharkNavCard> = {
  title: 'Display/SharkNavCard',
  component: SharkNavCard,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkNavCard>

export const Default: Story = {
  decorators: [(Story) => <div className="max-w-xs p-6"><Story /></div>],
  args: {
    tag: 'Programme',
    title: 'Friday → Sunday',
    description: 'Three days, two stages, one pack of sharks.',
    number: '02',
    accentColor: '#7c3aed',
  }
}

export const Grid: Story = {
  decorators: [(Story) => <div className="p-6 bg-[#fafaf9]"><Story /></div>],
  render: () => (
    <div className="grid grid-cols-3 gap-4 max-w-3xl">
      <SharkNavCard tag="Event Info" title="Plan your weekend" description="Arrival times, what to bring, site rules." number="01" accentColor="#fbbf24" />
      <SharkNavCard tag="Programme" title="Friday → Sunday" description="Three days, two stages, one pack of sharks." number="02" accentColor="#7c3aed" />
      <SharkNavCard tag="Pitches" title="Find your spot" description="Areas A, B and C — sea views go fast." number="03" accentColor="#15803d" />
      <SharkNavCard tag="Gallery" title="See the photos" description="Shots from SharkFest 2027." number="04" accentColor="#0e7490" />
      <SharkNavCard tag="Food & drink" title="The Village" description="Long-table tents, street food, three bars." number="05" accentColor="#c2410c" />
      <SharkNavCard tag="Register" title="Grab your pitch" description="Camping and day-tickets available now." number="06" accentColor="#e11d48" />
    </div>
  )
}
