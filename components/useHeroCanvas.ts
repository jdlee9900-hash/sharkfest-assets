'use client'

import { useEffect, RefObject } from 'react'

interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; opacity: number; hue: number
}
interface Fin { x: number; y: number; phase: number; speed: number; size: number; dir: number }

export function useHeroCanvas(ref: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    let t = 0
    let mx = -2000, my = -2000
    let particles: Particle[] = []
    let fins: Fin[] = []

    function resize() {
      canvas!.width  = canvas!.offsetWidth
      canvas!.height = canvas!.offsetHeight
      init()
    }

    function init() {
      const w = canvas!.width, h = canvas!.height
      particles = Array.from({ length: 90 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.random() * 0.45 + 0.15),
        size: Math.random() * 1.8 + 0.4,
        opacity: Math.random() * 0.45 + 0.08,
        hue: Math.random() * 24 - 12,
      }))
      fins = Array.from({ length: 4 }, (_, i) => ({
        x: (w / 5) * (i + 1) + (Math.random() * 60 - 30),
        y: h * 0.74,
        phase: (i * Math.PI) / 2,
        speed: 0.003 + Math.random() * 0.0025,
        size: 18 + Math.random() * 16,
        dir: i % 2 === 0 ? 1 : -1,
      }))
    }

    function drawGrid() {
      ctx!.strokeStyle = 'rgba(255,255,255,0.018)'
      ctx!.lineWidth = 1
      const s = 60
      for (let x = 0; x < canvas!.width; x += s) {
        ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, canvas!.height); ctx!.stroke()
      }
      for (let y = 0; y < canvas!.height; y += s) {
        ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(canvas!.width, y); ctx!.stroke()
      }
    }

    function drawParticles() {
      const w = canvas!.width, h = canvas!.height
      particles.forEach(p => {
        const dx = p.x - mx, dy = p.y - my
        const d2 = dx * dx + dy * dy
        const infl = d2 < 22500 ? Math.max(0, 1 - Math.sqrt(d2) / 150) : 0

        p.x += p.vx + (infl > 0 ? (dx / Math.sqrt(d2)) * infl * 0.6 : 0)
        p.y += p.vy - infl * 0.35

        if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; p.vx = (Math.random() - 0.5) * 0.25 }
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0

        const r = p.size * (1 + infl * 2.5)
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(251,${181 + p.hue | 0},36,${p.opacity * (1 + infl * 2)})`
        ctx!.fill()
      })
    }

    function drawWaves() {
      const w = canvas!.width, h = canvas!.height
      const baseY = h * 0.74
      ;[
        { amp: 22, freq: 0.010, spd: 0.010, off: 0,   a: 0.13 },
        { amp: 14, freq: 0.015, spd: 0.014, off: 1.6, a: 0.09 },
        { amp: 8,  freq: 0.022, spd: 0.018, off: 3.1, a: 0.06 },
      ].forEach(l => {
        ctx!.beginPath()
        for (let x = 0; x <= w; x += 2) {
          const y = baseY + Math.sin(x * l.freq + t * l.spd + l.off) * l.amp
          x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y)
        }
        ctx!.lineTo(w, h); ctx!.lineTo(0, h); ctx!.closePath()
        ctx!.fillStyle = `rgba(10,15,30,${l.a})`
        ctx!.fill()
      })
    }

    function drawFin(fin: Fin) {
      const h = canvas!.height
      const bob = Math.sin(fin.phase + t * fin.speed)
      if (bob > 0.8) return
      const yOff = bob * fin.size * 0.65
      const finY = h * 0.74 + yOff - fin.size * 0.28

      const dx = fin.x - mx, dy = finY - my
      const glow = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 220)

      ctx!.beginPath()
      ctx!.moveTo(fin.x, finY + fin.size)
      ctx!.quadraticCurveTo(fin.x - fin.size * 0.45, finY + fin.size * 0.25, fin.x, finY)
      ctx!.quadraticCurveTo(fin.x + fin.size * 0.9,  finY + fin.size * 0.25, fin.x + fin.size, finY + fin.size)
      ctx!.closePath()

      const g = ctx!.createLinearGradient(fin.x, finY, fin.x, finY + fin.size)
      g.addColorStop(0, `rgba(251,191,36,${0.28 + glow * 0.45})`)
      g.addColorStop(1, `rgba(251,191,36,${0.03 + glow * 0.1})`)
      ctx!.fillStyle = g
      ctx!.fill()

      fin.x += fin.dir * (0.22 + Math.cos(fin.phase + t * fin.speed * 0.5) * 0.18)
      if (fin.x < -70) { fin.x = canvas!.width + 70; fin.dir = Math.abs(fin.dir) }
      if (fin.x > canvas!.width + 70) { fin.x = -70; fin.dir = -Math.abs(fin.dir) }
    }

    function frame() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      drawGrid()
      drawParticles()
      drawWaves()
      fins.forEach(drawFin)
      t++
      raf = requestAnimationFrame(frame)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    frame()

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      mx = e.clientX - r.left; my = e.clientY - r.top
    }
    const onLeave = () => { mx = -2000; my = -2000 }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [ref])
}
