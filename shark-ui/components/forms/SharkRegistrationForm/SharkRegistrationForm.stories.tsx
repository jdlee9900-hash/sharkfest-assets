import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkRegistrationForm } from './SharkRegistrationForm'

const meta: Meta<typeof SharkRegistrationForm> = {
  title: 'Forms/SharkRegistrationForm',
  component: SharkRegistrationForm,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkRegistrationForm>

export const Default: Story = {
  decorators: [(Story) => <div className="max-w-lg mx-auto p-6 bg-white rounded-[16px] shadow-lg"><Story /></div>],
}
