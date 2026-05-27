import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { SharkLightbox } from './SharkLightbox'
import { SharkButton } from '../../primitives/SharkButton/SharkButton'

const meta: Meta<typeof SharkLightbox> = {
  title: 'Gallery/SharkLightbox',
  component: SharkLightbox,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof SharkLightbox>

const photos = Array.from({ length: 6 }, (_, i) => ({
  id: String(i),
  src: `https://images.unsplash.com/photo-${['1493225457124-a3eb161ffa5f','1506905925346-21bda4d32df4','1571019613454-1cb2f99b2d8b','1459749411175-04bf5292ceea','1540575467063-178a50c2df87','1501281668745-a7a57abb5d70'][i]}?w=1200&q=80`,
  alt: `Festival photo ${i + 1}`,
  filename: `sharkfest-2027-${String(i+1).padStart(2,'0')}.jpg`,
}))

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    const [idx, setIdx] = useState(0)
    return (
      <>
        <div className="p-6">
          <SharkButton onClick={() => { setIdx(0); setOpen(true) }}>Open lightbox</SharkButton>
        </div>
        {open && (
          <SharkLightbox
            photos={photos}
            currentIndex={idx}
            onClose={() => setOpen(false)}
            onNavigate={setIdx}
          />
        )}
      </>
    )
  }
}
