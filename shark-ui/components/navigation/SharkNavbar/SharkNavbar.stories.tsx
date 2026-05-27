import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkNavbar } from './SharkNavbar'

const meta: Meta<typeof SharkNavbar> = {
  title: 'Navigation/SharkNavbar',
  component: SharkNavbar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkNavbar>

export const OnDark: Story = {
  decorators: [(Story) => <div className="min-h-64 bg-[#0f172a] relative"><Story /></div>],
}
export const Scrolled: Story = {
  decorators: [(Story) => (
    <div className="min-h-64 bg-[#fafaf9] relative">
      <style>{`nav { background: white !important; border-bottom: 1px solid #e2e8f0 !important; }`}</style>
      <Story />
    </div>
  )],
}
