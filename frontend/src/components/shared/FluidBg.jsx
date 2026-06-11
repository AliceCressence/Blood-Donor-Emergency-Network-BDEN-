// src/components/shared/FluidBg.jsx
// Canvas-based liquid blob background with angle-drift physics + mouse spring.
// Place inside a `relative overflow-hidden` container — the canvas fills it absolutely.
import { useEffect, useRef } from 'react'

export default function FluidBg({ className = '' }) {
  const canvasRef = useRef(null)
  const mouse     = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W = 0, H = 0, animId
    let initialized = false

    // 7 large blobs — start at (0,0), repositioned on first valid resize
    const blobs = Array.from({ length: 7 }, (_, i) => ({
      x:     0,
      y:     0,
      vx:    0,
      vy:    0,
      angle: (i / 7) * Math.PI * 2,          // evenly distributed start directions
      speed: 0.022 + Math.random() * 0.014,   // per-blob drift thrust
      r:     160 + i * 30 + Math.random() * 60, // 160–400 px
      phase: Math.random() * Math.PI * 2,
      op:    0.24 + Math.random() * 0.14,     // 0.24–0.38
    }))

    const initBlobs = () => {
      blobs.forEach(b => {
        b.x  = Math.random() * W
        b.y  = Math.random() * H
        // Give each blob a small random starting velocity
        b.vx = Math.cos(b.angle) * 0.4
        b.vy = Math.sin(b.angle) * 0.4
      })
      initialized = true
    }

    const applyResize = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      if (w === W && h === H) return
      W = canvas.width  = w
      H = canvas.height = h
      if (!initialized && W > 0 && H > 0) initBlobs()
    }

    // ResizeObserver fires on first layout + any subsequent size changes
    const ro = new ResizeObserver(applyResize)
    ro.observe(canvas)
    applyResize()
    window.addEventListener('resize', applyResize)

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    document.addEventListener('mousemove', onMove)

    const draw = (ts) => {
      animId = requestAnimationFrame(draw)
      if (!initialized) return

      ctx.clearRect(0, 0, W, H)
      const time        = ts * 0.001
      const { x: mx, y: my } = mouse.current

      for (const b of blobs) {
        const r = b.r + Math.sin(time * 0.35 + b.phase) * 30

        // Slow angle rotation — creates smooth direction changes over time
        b.angle += 0.0008 + Math.sin(time * 0.12 + b.phase) * 0.0004

        // Autonomous drift thrust along current angle
        b.vx += Math.cos(b.angle) * b.speed
        b.vy += Math.sin(b.angle) * b.speed

        // Mouse spring — liquid pulls toward cursor within 520px
        const mdx = mx - b.x
        const mdy = my - b.y
        const md  = Math.hypot(mdx, mdy)
        if (md < 520 && md > 1) {
          const f = (1 - md / 520) * 0.032
          b.vx += (mdx / md) * f
          b.vy += (mdy / md) * f
        }

        // Viscous dampening
        b.vx *= 0.96
        b.vy *= 0.96
        b.x  += b.vx
        b.y  += b.vy

        // Soft wrap — blobs drift back from the opposite edge
        if (b.x < -r) b.x = W + r
        if (b.x > W + r) b.x = -r
        if (b.y < -r) b.y = H + r
        if (b.y > H + r) b.y = -r

        // Radial gradient — vibrant crimson core fading to transparent
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r)
        g.addColorStop(0,    `rgba(235, 26, 26, ${b.op})`)
        g.addColorStop(0.28, `rgba(195, 12, 12, ${b.op * 0.60})`)
        g.addColorStop(0.58, `rgba(130,  5,  5, ${b.op * 0.22})`)
        g.addColorStop(1,    'rgba(40,   1,  1, 0)')

        ctx.beginPath()
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      }
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      window.removeEventListener('resize', applyResize)
      document.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${className}`}
    />
  )
}
