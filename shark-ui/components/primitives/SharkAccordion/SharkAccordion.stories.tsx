import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkAccordion } from './SharkAccordion'

const meta: Meta<typeof SharkAccordion> = {
  title: 'Primitives/SharkAccordion',
  component: SharkAccordion,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-xl p-6 bg-[#fafaf9]"><Story /></div>],
}
export default meta
type Story = StoryObj<typeof SharkAccordion>

const items = [
  { question: 'What time do the gates open?', answer: 'Gates open Friday at 12:00. Late arrival is fine — just slower. Saturday and Sunday from 08:00.', category: 'Arrival' },
  { question: 'Can I bring my own food?', answer: 'Absolutely. The site has no restrictions on food brought in for camping consumption. Traders are available too.', category: 'Food' },
  { question: 'Is the site dog-friendly?', answer: 'Dogs are welcome in camping areas. They must be kept on a lead at all times and are not permitted in the food village or grandstand.', category: 'General' },
  { question: 'Where do I collect my wristband?', answer: 'Wristbands are issued at the main gate on arrival. Bring a photo ID and your booking confirmation.', category: 'Arrival' },
]

export const Default: Story = { args: { items } }
export const MultipleOpen: Story = { args: { items, allowMultiple: true } }
