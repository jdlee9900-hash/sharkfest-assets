import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkStatCard } from './SharkStatCard'

const meta: Meta<typeof SharkStatCard> = {
  title: 'Display/SharkStatCard',
  component: SharkStatCard,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkStatCard>

export const Default: Story = { args: { value: '42', unit: 'acts', label: 'Performing this weekend', accentColor: '#fbbf24' } }

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4 p-6">
      <SharkStatCard value="42" unit="acts" label="Performing this weekend" accentColor="#fbbf24" />
      <SharkStatCard value="216" unit="pitches" label="Across areas A, B & C" accentColor="#38bdf8" />
      <SharkStatCard value="3" label="Days of festival" accentColor="#7c3aed" />
      <SharkStatCard value="4" label="Years running" accentColor="#15803d" />
    </div>
  )
}
