import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkCountdown } from './SharkCountdown'

const meta: Meta<typeof SharkCountdown> = {
  title: 'Live/SharkCountdown',
  component: SharkCountdown,
  parameters: { backgrounds: { default: 'dark' } },
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkCountdown>

export const Default: Story = {
  args: { targetDate: new Date('2028-05-26T12:00:00') }
}
