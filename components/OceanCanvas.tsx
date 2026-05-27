'use client'

import { useRef } from 'react'
import { useHeroCanvas } from './useHeroCanvas'

export function OceanCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useHeroCanvas(ref)
  return <canvas ref={ref} className="ocean-canvas" aria-hidden="true" />
}
