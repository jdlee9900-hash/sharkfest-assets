import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkInput } from './SharkInput'
import { Search as SearchIcon, Mail } from 'lucide-react'

const meta: Meta<typeof SharkInput> = {
  title: 'Primitives/SharkInput',
  component: SharkInput,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-sm p-6 bg-white"><Story /></div>],
}
export default meta
type Story = StoryObj<typeof SharkInput>

export const Default: Story = { args: { label: 'Full name', placeholder: 'Jo Bloggs', hint: 'As shown on your booking confirmation.' } }
export const WithError: Story = { args: { label: 'Email', placeholder: 'you@example.com', error: 'Enter a valid email address.', leftIcon: <Mail className="w-4 h-4" />, value: 'not-an-email' } }
export const SearchInput: Story = { args: { variant: 'search', placeholder: 'Search pitches…', leftIcon: <SearchIcon className="w-4 h-4" />, clearable: true } }
export const Disabled: Story = { args: { label: 'Pitch reference', value: 'SHK-2028-0042', disabled: true } }
