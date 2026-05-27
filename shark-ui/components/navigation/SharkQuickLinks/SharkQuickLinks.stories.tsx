import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkQuickLinks } from './SharkQuickLinks'

const meta: Meta<typeof SharkQuickLinks> = {
  title: 'Navigation/SharkQuickLinks',
  component: SharkQuickLinks,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkQuickLinks>

export const Default: Story = {
  args: {
    links: [
      { label: 'Getting here', href: '#' },
      { label: 'What to bring', href: '#', active: true },
      { label: 'Site rules', href: '#' },
      { label: 'Family camping', href: '#' },
      { label: 'Accessibility', href: '#' },
      { label: 'Food village', href: '#' },
    ]
  }
}
