import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkSectionHeader } from './SharkSectionHeader'

const meta: Meta<typeof SharkSectionHeader> = {
  title: 'Display/SharkSectionHeader',
  component: SharkSectionHeader,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl mx-auto p-12 bg-white"><Story /></div>],
}
export default meta
type Story = StoryObj<typeof SharkSectionHeader>

export const Default: Story = { args: { eyebrow: 'Programme', title: 'What\'s On', subtitle: 'Three days of music, food, and rugby. See it all below.', align: 'center' } }
export const LeftAligned: Story = { args: { eyebrow: 'Event info', title: 'Plan Your Weekend', align: 'left' } }
