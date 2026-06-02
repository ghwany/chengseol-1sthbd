import { useEffect, useRef } from 'react'

/**
 * 햇살 속 먼지 같은 빛 입자(G). 전용 canvas, 입자 상한·매우 느린 드리프트.
 * 탭 숨김 시 정지(visibilitychange). canvas 2d 미지원이면 조용히 생략.
 * 결정적 분포(인덱스 기반) — Math.random 미사용으로 안정.
 */
export default function LightMotes({ enabled = true, count = 18 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext && canvas.getContext('2d')
    if (!ctx) return // jsdom 등 미지원 → 생략

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0, h = 0, raf = 0, t = 0
    const motes = []
    for (let i = 0; i < count; i++) {
      motes.push({
        x: ((i * 97) % 100) / 100,
        y: ((i * 53) % 100) / 100,
        r: 0.6 + (((i * 31) % 10) / 10) * 1.4,
        sp: 0.015 + (((i * 17) % 10) / 10) * 0.03, // 매우 느림
        ph: (i * 0.7) % (Math.PI * 2),
      })
    }

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, w * dpr)
      canvas.height = Math.max(1, h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const frame = () => {
      t += 0.016
      ctx.clearRect(0, 0, w, h)
      for (const m of motes) {
        const x = m.x * w + Math.sin(t * m.sp * 6 + m.ph) * 8
        const yRaw = (m.y - (t * m.sp)) % 1
        const y = (((yRaw % 1) + 1) % 1) * h
        ctx.beginPath()
        ctx.arc(x, y, m.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(176, 138, 79, 0.16)' // gold 극옅게
        ctx.fill()
      }
      raf = requestAnimationFrame(frame)
    }
    const onVisibility = () => {
      if (document.hidden) {
        if (raf) { cancelAnimationFrame(raf); raf = 0 }
      } else if (!raf) {
        raf = requestAnimationFrame(frame)
      }
    }

    resize()
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', resize, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, count])

  return <canvas className="motes" ref={canvasRef} aria-hidden="true" />
}
