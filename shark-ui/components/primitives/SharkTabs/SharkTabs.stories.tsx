import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkTabs } from './SharkTabs'

const meta: Meta<typeof SharkTabs> = {
  title: 'Primitives/SharkTabs',
  component: SharkTabs,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-lg p-6 bg-white"><Story /></div>],
}
export default meta
type Story = StoryObj<typeof SharkTabs>

const tabs = [
  { id: 'fri', label: 'Friday', content: <p className="text-sm text-[#64748b]">Gates open 12:00. Main stage from 17:00.</p> },
  { id: 'sat', label: 'Saturday', content: <p className="text-sm text-[#64748b]">Full day programme. Rugby from 10:00, music until midnight.</p> },
  { id: 'sun', label: 'Sunday', content: <p className="text-sm text-[#64748b]">Finale day. Final sets from 17:00. Site clears by 22:00.</p> },
]

export const Underline: Story = { args: { items: tabs, variant: 'underline' } }
export const Pill: Story = { args: { items: tabs, variant: 'pill' } }
export const Card: Story = { args: { items: tabs, variant: 'card' } }
