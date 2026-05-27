import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkHeroBanner } from './SharkHeroBanner'
import { SharkButton } from '../../primitives/SharkButton/SharkButton'

const meta: Meta<typeof SharkHeroBanner> = {
  title: 'Display/SharkHeroBanner',
  component: SharkHeroBanner,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkHeroBanner>

export const Default: Story = {
  args: {
    eyebrow: 'Torbay Sharks RFC · Devon Coast',
    title: 'SharkFest 2028',
    subtitle: 'Three days, two stages, one pack of sharks.',
    stats: [
      { value: '42', label: 'acts' },
      { value: '216', label: 'pitches' },
      { value: '3', label: 'days' },
    ],
  },
  render: (args) => (
    <SharkHeroBanner {...args}>
      <SharkButton variant="accent" size="lg">Get tickets</SharkButton>
      <SharkButton variant="secondary" size="lg" className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20">See what&apos;s on</SharkButton>
    </SharkHeroBanner>
  ),
}
