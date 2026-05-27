import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { SharkModal } from './SharkModal'
import { SharkButton } from '../SharkButton/SharkButton'

const meta: Meta<typeof SharkModal> = {
  title: 'Primitives/SharkModal',
  component: SharkModal,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkModal>

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <SharkButton onClick={() => setOpen(true)}>Open modal</SharkButton>
        <SharkModal
          open={open}
          onClose={() => setOpen(false)}
          title="Confirm your pitch"
          description="You are about to claim Pitch B-14. This cannot be undone once confirmed."
          footer={
            <>
              <SharkButton variant="ghost" onClick={() => setOpen(false)}>Cancel</SharkButton>
              <SharkButton variant="accent" onClick={() => setOpen(false)}>Confirm</SharkButton>
            </>
          }
        >
          <p className="text-sm text-[#64748b]">Pitch B-14 is a standard pitch in Area B. It includes power hook-up and is 5m × 8m.</p>
        </SharkModal>
      </>
    )
  }
}
