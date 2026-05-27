'use client'

import { useRef, useEffect, RefObject } from 'react'

interface UsePinchZoomOptions {
  minScale?: number
  maxScale?: number
}

export function usePinchZoom(
  containerRef: RefObject<HTMLDivElement | null>,
  options: UsePinchZoomOptions = {}
) {
  const { minScale = 1, maxScale = 5 } = options
  const scaleRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  const lastPinchRef = useRef<number | null>(null)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function clampPan(x: number, y: number, scale: number) {
      const rect = el!.getBoundingClientRect()
      const maxX = (rect.width * (scale - 1)) / 2
      const maxY = (rect.height * (scale - 1)) / 2
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      }
    }

    function applyTransform() {
      const s = scaleRef.current
      const p = panRef.current
      el!.style.transform = `translate(${p.x}px, ${p.y}px) scale(${s})`
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 1.1 : 0.9
      scaleRef.current = Math.min(maxScale, Math.max(minScale, scaleRef.current * delta))
      if (scaleRef.current === minScale) panRef.current = { x: 0, y: 0 }
      else panRef.current = clampPan(panRef.current.x, panRef.current.y, scaleRef.current)
      applyTransform()
    }

    function onPointerDown(e: PointerEvent) {
      if (scaleRef.current > 1) {
        isDraggingRef.current = true
        lastPointerRef.current = { x: e.clientX, y: e.clientY }
        el!.setPointerCapture(e.pointerId)
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDraggingRef.current || !lastPointerRef.current) return
      const dx = e.clientX - lastPointerRef.current.x
      const dy = e.clientY - lastPointerRef.current.y
      lastPointerRef.current = { x: e.clientX, y: e.clientY }
      panRef.current = clampPan(panRef.current.x + dx, panRef.current.y + dy, scaleRef.current)
      applyTransform()
    }

    function onPointerUp() {
      isDraggingRef.current = false
      lastPointerRef.current = null
    }

    function onDblClick() {
      if (scaleRef.current > 1) {
        scaleRef.current = minScale
        panRef.current = { x: 0, y: 0 }
      } else {
        scaleRef.current = Math.min(maxScale, 2.5)
      }
      applyTransform()
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('dblclick', onDblClick)
    el.style.touchAction = 'none'
    el.style.cursor = 'grab'
    el.style.transition = 'transform 0.1s ease'

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('dblclick', onDblClick)
    }
  }, [containerRef, minScale, maxScale])

  function zoomIn() {
    scaleRef.current = Math.min(maxScale, scaleRef.current * 1.3)
    const el = containerRef.current
    if (el) el.style.transform = `scale(${scaleRef.current}) translate(${panRef.current.x}px, ${panRef.current.y}px)`
  }

  function zoomOut() {
    scaleRef.current = Math.max(minScale, scaleRef.current / 1.3)
    if (scaleRef.current === minScale) panRef.current = { x: 0, y: 0 }
    const el = containerRef.current
    if (el) el.style.transform = `scale(${scaleRef.current}) translate(${panRef.current.x}px, ${panRef.current.y}px)`
  }

  function resetZoom() {
    scaleRef.current = minScale
    panRef.current = { x: 0, y: 0 }
    const el = containerRef.current
    if (el) el.style.transform = 'scale(1) translate(0,0)'
  }

  return { zoomIn, zoomOut, resetZoom }
}
