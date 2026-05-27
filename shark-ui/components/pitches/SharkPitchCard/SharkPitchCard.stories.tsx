import type { Meta, StoryObj } from '@storybook/nextjs'
import { SharkPitchCard } from './SharkPitchCard'

const meta: Meta<typeof SharkPitchCard> = {
  title: 'Pitches/SharkPitchCard',
  component: SharkPitchCard,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof SharkPitchCard>

export const Default: Story = { args: { pitch: { id: 'a1', area: 'A', number: 14, name: 'Smith family' } } }
export const Selected: Story = { args: { pitch: { id: 'b5', area: 'B', number: 5, name: 'Davies' }, selected: true } }
export const WithNote: Story = { args: { pitch: { id: 'c2', area: 'C', number: 2, name: 'Johnson', note: 'Saturday Only' } } }

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-3 p-6 bg-[#fafaf9]">
      {[{id:'a1',area:'A',number:1},{id:'a2',area:'A',number:2},{id:'b1',area:'B',number:1,name:'Doe',note:'Saturday Only'},{id:'b2',area:'B',number:2},{id:'c1',area:'C',number:1},{id:'c2',area:'C',number:2}].map((p) => (
        <SharkPitchCard key={p.id} pitch={p as import('./SharkPitchCard').Pitch} selected={p.id === 'b1'} />
      ))}
    </div>
  )
}
