import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkPhotoGrid } from './SharkPhotoGrid'

const meta: Meta<typeof SharkPhotoGrid> = {
  title: 'Gallery/SharkPhotoGrid',
  component: SharkPhotoGrid,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof SharkPhotoGrid>

const photos = Array.from({ length: 12 }, (_, i) => ({
  id: String(i),
  src: `https://images.unsplash.com/photo-${['1493225457124-a3eb161ffa5f','1506905925346-21bda4d32df4','1571019613454-1cb2f99b2d8b','1459749411175-04bf5292ceea','1540575467063-178a50c2df87','1501281668745-a7a57abb5d70'][i % 6]}?w=600&q=80`,
  alt: `Festival photo ${i + 1}`,
  filename: `sharkfest-2027-${String(i+1).padStart(2,'0')}.jpg`,
}))

export const Grid: Story = {
  args: { photos, view: 'grid' },
  decorators: [(Story) => <div className="p-6 bg-[#fafaf9]"><Story /></div>],
}
export const Masonry: Story = {
  args: { photos, view: 'masonry' },
  decorators: [(Story) => <div className="p-6 bg-[#fafaf9]"><Story /></div>],
}
