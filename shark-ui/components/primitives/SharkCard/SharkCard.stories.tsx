import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkCard } from './SharkCard'

const meta: Meta<typeof SharkCard> = {
  title: 'Primitives/SharkCard',
  component: SharkCard,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkCard>

const SampleContent = () => (
  <>
    <h3 className="font-display text-2xl mb-1">Main Stage</h3>
    <p className="text-sm text-[#64748b]">Saturday — 21:00 to midnight</p>
  </>
)

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 p-6 bg-[#fafaf9]">
      <SharkCard variant="default"><SampleContent /></SharkCard>
      <SharkCard variant="elevated"><SampleContent /></SharkCard>
      <SharkCard variant="outline"><SampleContent /></SharkCard>
      <SharkCard variant="dark" className="col-span-1"><SampleContent /></SharkCard>
      <SharkCard variant="glass" className="bg-[#0f172a] col-span-2"><SampleContent /></SharkCard>
    </div>
  )
}

export const WithAccent: Story = {
  render: () => (
    <div className="flex gap-4 p-6">
      <SharkCard accent="#fbbf24" hover><SampleContent /></SharkCard>
      <SharkCard accent="#7c3aed" accentPosition="left"><SampleContent /></SharkCard>
      <SharkCard accent="#ef4444" hover><SampleContent /></SharkCard>
    </div>
  )
}
