import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkPhotoCard } from './SharkPhotoCard'

const meta: Meta<typeof SharkPhotoCard> = {
  title: 'Gallery/SharkPhotoCard',
  component: SharkPhotoCard,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkPhotoCard>

const photo = { id: '1', src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80', alt: 'Festival crowd at sunset', filename: 'sharkfest-2027-01.jpg' }

export const Default: Story = {
  args: { photo, index: 0, total: 47 },
  decorators: [(Story) => <div className="w-64 p-4"><Story /></div>],
}
