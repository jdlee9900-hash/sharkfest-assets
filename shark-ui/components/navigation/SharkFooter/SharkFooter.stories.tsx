import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkFooter } from './SharkFooter'

const meta: Meta<typeof SharkFooter> = {
  title: 'Navigation/SharkFooter',
  component: SharkFooter,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkFooter>

export const Default: Story = {}
