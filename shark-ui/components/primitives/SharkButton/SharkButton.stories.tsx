import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkButton } from './SharkButton'
import { Ticket, Map, ArrowRight } from 'lucide-react'

const meta: Meta<typeof SharkButton> = {
  title: 'Primitives/SharkButton',
  component: SharkButton,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger', 'accent', 'strava'] },
    size:    { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
  },
}
export default meta
type Story = StoryObj<typeof SharkButton>

export const Default: Story = { args: { variant: 'primary', size: 'md', children: 'Register now' } }

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 p-6 bg-[#fafaf9]">
      <SharkButton variant="primary">Register now</SharkButton>
      <SharkButton variant="secondary">View map</SharkButton>
      <SharkButton variant="ghost">Skip</SharkButton>
      <SharkButton variant="accent" rightIcon={<ArrowRight className="w-4 h-4" />}>Get tickets</SharkButton>
      <SharkButton variant="danger">Cancel booking</SharkButton>
      <SharkButton variant="strava" leftIcon={<span style={{fontSize:14}}>⚡</span>}>Connect Strava</SharkButton>
    </div>
  )
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center p-6">
      <SharkButton size="xs">XS</SharkButton>
      <SharkButton size="sm">Small</SharkButton>
      <SharkButton size="md">Medium</SharkButton>
      <SharkButton size="lg">Large</SharkButton>
      <SharkButton size="xl">Extra large</SharkButton>
    </div>
  )
}

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 p-6">
      <SharkButton>Default</SharkButton>
      <SharkButton loading loadingText="Saving…">Save</SharkButton>
      <SharkButton disabled>Disabled</SharkButton>
      <SharkButton leftIcon={<Ticket className="w-4 h-4" />}>With icon</SharkButton>
    </div>
  )
}

export const DarkBackground: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => (
    <div className="flex flex-wrap gap-3 p-6">
      <SharkButton variant="accent">Get tickets</SharkButton>
      <SharkButton variant="secondary" className="!bg-white/10 !text-white !border-white/20">See what&apos;s on</SharkButton>
    </div>
  )
}
