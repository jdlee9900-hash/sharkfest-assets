'use client'

import { useState, useMemo } from 'react'
import { SharkPitchCard, Pitch } from '../SharkPitchCard/SharkPitchCard'
import { SharkInput } from '../../primitives/SharkInput/SharkInput'
import { Search } from 'lucide-react'
import { cn } from '@/utils'

export interface SharkPitchGridProps {
  pitches: Pitch[]
  onSelect?: (pitch: Pitch) => void
  className?: string
}

export function SharkPitchGrid({ pitches, onSelect, className }: SharkPitchGridProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [areaFilter, setAreaFilter] = useState<'all' | 'A' | 'B' | 'C'>('all')

  const filtered = useMemo(() => pitches.filter(p => {
    const matchArea = areaFilter === 'all' || p.area === areaFilter
    const q = search.toLowerCase()
    const matchSearch = !q || String(p.number).includes(q) || (p.name ?? '').toLowerCase().includes(q)
    return matchArea && matchSearch
  }), [pitches, search, areaFilter])

  function handleSelect(p: Pitch) {
    setSelected(p.id)
    onSelect?.(p)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <SharkInput
            placeholder="Search by number or name…"
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            clearable
            onClear={() => setSearch('')}
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'A', 'B', 'C'] as const).map(area => (
            <button
              key={area}
              onClick={() => setAreaFilter(area)}
              className={cn(
                'px-3 py-2 rounded-[8px] text-sm font-body font-medium transition-colors',
                areaFilter === area
                  ? 'bg-[#0f172a] text-white'
                  : 'bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]',
              )}
            >
              {area === 'all' ? 'All' : `Area ${area}`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[#94a3b8] text-center py-8">No pitches match your search.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
          {filtered.map(p => (
            <SharkPitchCard
              key={p.id}
              pitch={p}
              selected={selected === p.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
