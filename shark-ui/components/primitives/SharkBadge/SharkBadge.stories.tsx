import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkBadge } from './SharkBadge'

const meta: Meta<typeof SharkBadge> = {
  title: 'Primitives/SharkBadge',
  component: SharkBadge,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkBadge>

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 p-6 bg-white">
      <SharkBadge variant="default">Default</SharkBadge>
      <SharkBadge variant="brand">Brand</SharkBadge>
      <SharkBadge variant="success">Success</SharkBadge>
      <SharkBadge variant="warning">Warning</SharkBadge>
      <SharkBadge variant="danger">Danger</SharkBadge>
      <SharkBadge variant="info">Info</SharkBadge>
      <SharkBadge variant="live" dot pulse>LIVE</SharkBadge>
      <SharkBadge variant="soon" dot>SOON</SharkBadge>
      <SharkBadge variant="past">PAST</SharkBadge>
      <SharkBadge variant="area-a">Area A</SharkBadge>
      <SharkBadge variant="area-b">Area B</SharkBadge>
      <SharkBadge variant="cat-music">Music</SharkBadge>
      <SharkBadge variant="cat-dj">DJ</SharkBadge>
      <SharkBadge variant="cat-rugby">Rugby</SharkBadge>
      <SharkBadge variant="cat-food">Food</SharkBadge>
      <SharkBadge variant="cat-bar">Bar</SharkBadge>
      <SharkBadge variant="cat-wellness">Wellness</SharkBadge>
      <SharkBadge variant="cat-kids">Kids</SharkBadge>
      <SharkBadge variant="cat-general">General</SharkBadge>
    </div>
  )
}
