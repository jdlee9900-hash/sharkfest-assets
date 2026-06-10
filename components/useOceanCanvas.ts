'use client'

import { useEffect, RefObject } from 'react'

interface Particle {
  x: number; y: number; size: number; speed: number; opacity: number
}

interface Fin {
  x: number; y: number; phase: number; speed: number; size: number
}

interface Wave {
  amplitude: number; frequency: number; speed: number; offset: number; opacity: number
}

export function useOceanCanvas(canvasRef: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let particles: Particle[] = []
    let fins: Fin[] = []
    let waves: Wave[] = []
    let t = 0

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      init()
    }

    function init() {
      if (!canvas) return
      const w = canvas.width
      const h = canvas.height

      particles = Array.from({ length: 60 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.4 + 0.1,
        opacity: Math.random() * 0.4 + 0.1,
      }))

      fins = Array.from({ length: 3 }, (_, i) => ({
        x: (w / 4) * (i + 1) + Math.random() * 80 - 40,
        y: h * 0.72,
        phase: (i * Math.PI * 2) / 3,
        speed: 0.003 + Math.random() * 0.002,
        size: 18 + Math.random() * 12,
      }))

      waves = [
        { amplitude: 18, frequency: 0.012, speed: 0.012, offset: 0,   opacity: 0.15 },
        { amplitude: 12, frequency: 0.018, speed: 0.016, offset: 1.5, opacity: 0.10 },
        { amplitude: 8,  frequency: 0.024, speed: 0.020, offset: 3.0, opacity: 0.07 },
      ]
    }

    function drawGrid() {
      if (!canvas || !ctx) return
      ctx.strokeStyle = 'rgba(255,255,255,0.02)'
      ctx.lineWidth = 1
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
      }
    }

    function drawParticles() {
      if (!canvas || !ctx) return
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(251,191,36,${p.opacity})`
        ctx.fill()
        p.y -= p.speed
        if (p.y < -5) { p.y = canvas!.height + 5; p.x = Math.random() * canvas!.width }
      })
    }

    function drawWaves() {
      if (!canvas || !ctx) return
      const w = canvas.width
      const h = canvas.height
      waves.forEach(wave => {
        ctx.beginPath()
        for (let x = 0; x <= w; x += 2) {
          const y = h * 0.72 + Math.sin(x * wave.frequency + t * wave.speed + wave.offset) * wave.amplitude
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath()
        ctx.fillStyle = `rgba(15,23,42,${wave.opacity})`
        ctx.fill()
      })
    }

    function drawFin(fin: Fin) {
      if (!ctx || !canvas) return
      const h = canvas.height
      const submerge = Math.sin(fin.phase + t * fin.speed)
      const yOffset = submerge * fin.size * 0.8
      const finY = h * 0.72 + yOffset - fin.size * 0.3
      if (submerge > 0.7) return // fully submerged

      ctx.beginPath()
      ctx.moveTo(fin.x, finY + fin.size)
      ctx.quadraticCurveTo(fin.x - fin.size * 0.4, finY + fin.size * 0.3, fin.x, finY)
      ctx.quadraticCurveTo(fin.x + fin.size * 0.8, finY + fin.size * 0.3, fin.x + fin.size, finY + fin.size)
      ctx.closePath()
      const grad = ctx.createLinearGradient(fin.x, finY, fin.x, finY + fin.size)
      grad.addColorStop(0, 'rgba(251,191,36,0.25)')
      grad.addColorStop(1, 'rgba(251,191,36,0.05)')
      ctx.fillStyle = grad
      ctx.fill()

      fin.x += Math.cos(fin.phase + t * fin.speed * 0.5) * 0.3
      if (fin.x < -50) fin.x = canvas.width + 50
      if (fin.x > canvas.width + 50) fin.x = -50
    }

    function frame() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawGrid()
      drawParticles()
      drawWaves()
      fins.forEach(drawFin)
      t++
      animId = requestAnimationFrame(frame)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    frame()

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [canvasRef])
}
