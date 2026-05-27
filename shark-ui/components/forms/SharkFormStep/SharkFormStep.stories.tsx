import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { SharkFormStep } from './SharkFormStep'
import { SharkInput } from '../../primitives/SharkInput/SharkInput'

const meta: Meta<typeof SharkFormStep> = {
  title: 'Forms/SharkFormStep',
  component: SharkFormStep,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkFormStep>

export const Default: Story = {
  render: () => {
    const [step, setStep] = useState(0)
    const steps = [
      { label: 'Lead attendee',        description: 'Your personal details.' },
      { label: 'Group members',        description: 'Others camping with you.' },
      { label: 'Camping preferences',  description: 'Area and hook-up.' },
    ]
    return (
      <div className="max-w-lg mx-auto p-6 bg-white rounded-[16px] shadow">
        <SharkFormStep steps={steps} currentStep={step} onNext={() => setStep(s => Math.min(2, s + 1))} onBack={() => setStep(s => Math.max(0, s - 1))}>
          <SharkInput label="First name" placeholder="Jo" />
        </SharkFormStep>
      </div>
    )
  }
}
