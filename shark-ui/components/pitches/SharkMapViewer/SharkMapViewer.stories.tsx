import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkMapViewer } from './SharkMapViewer'

const meta: Meta<typeof SharkMapViewer> = {
  title: 'Pitches/SharkMapViewer',
  component: SharkMapViewer,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkMapViewer>

export const Default: Story = {
  args: {
    mapUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
    alt: 'Festival site map',
  },
  decorators: [(Story) => <div className="p-6"><Story /></div>],
}
