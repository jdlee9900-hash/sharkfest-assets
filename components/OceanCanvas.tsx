'use client'

import { useRef } from 'react'
import { useOceanCanvas } from './useOceanCanvas'

export function OceanCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useOceanCanvas(canvasRef)
  return (
    <canvas
      ref={canvasRef}
      className="ocean-canvas"
      aria-hidden="true"
    />
  )
}
