import { useEffect, useRef } from 'react'

/**
 * 여름 윤슬 sparkle — 어두운 "수면 띠"(부모 .hero__water의 청록 그라데이션) 위에서만
 * 명멸하는 흰·은빛 정반사광. 띠 사각형 안에만 그린다(근-흰 한지 위엔 절대 안 그림 —
 * figure-ground 대비가 반전돼야 윤슬로 읽힌다). (스펙 §5-1 "옥빛 수면 띠")
 *
 *  - 합성 'lighter'(가산): 어두운 수면 위에서 빛이 더해져 빛난다.
 *  - 색: 흰빛 ~70% + 은빛 ~20% + 엷은 금빛 ~10%.
 *  - 분포: 중앙 집중 + 좌우 대칭 감쇠(삼각분포, glitter path). y는 3개 가로 결.
 *  - 모양: 가로로 길쭉한 빛줄기(타원). 명멸: s³ 펄스(짧게 번쩍), 위상 desync.
 *  - 결정적(Math.random 미사용). reduced-motion 시 부모가 enabled=false → 미렌더(띠는 유지).
 */

// sparkle 색(rgba 베이스) — a는 매 프레임 명멸값. 어두운 수면 위라 흰빛이 고대비.
const SPARKS = [
  '255, 255, 255', // 흰빛
  '223, 235, 240', // 은빛
  '214, 184, 120', // 엷은 금빛
]
// 70 / 20 / 10 : 10주기로 흰7 은2 금1
const COLOR_PATTERN = [0, 0, 0, 0, 0, 0, 0, 1, 1, 2]
const GOLDEN = 0.6180339887

export default function WaterShimmer({ enabled = true, count = 50 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext && canvas.getContext('2d')
    if (!ctx) return // jsdom 등 미지원 → 생략

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0,
      h = 0,
      raf = 0,
      t = 0

    const sparks = []
    for (let i = 0; i < count; i++) {
      const u = ((i * 31) % 17) / 17
      const v = ((i * 53) % 19) / 19
      // x: 중앙 집중 + 좌우 대칭. 두 결정적 균등의 평균 = 삼각분포(μ=0.5, glitter path).
      const r1 = (i * GOLDEN + 0.13) % 1
      const r2 = (i * 0.3819660113 + 0.71) % 1
      const x = (r1 + r2) / 2
      // y: 3개 가로 결(수면 결)
      const band = (i % 3) / 2
      const y = 0.2 + band * 0.6 + (v - 0.5) * 0.14
      sparks.push({
        x,
        y: Math.min(0.94, Math.max(0.06, y)),
        r: 0.8 + u * 1.4, // 세로 반경 0.8~2.2px
        sx: 2.5 + u * 2.0, // 가로 늘임 2.5~4.5배 — 수면 반사 줄무늬
        color: SPARKS[COLOR_PATTERN[i % COLOR_PATTERN.length]],
        twPeriod: 0.6 + u * 1.0, // 빠른 명멸 0.6~1.6s
        twPhase: (i * 1.7) % (Math.PI * 2), // 위상 desync(전체장은 안 깜빡, 개별만 팝)
        swayAmp: 2 + v * 3, // ±2~5px
        swPeriod: 1.8 + ((i * 7) % 10) / 10 * 1.4, // 1.8~3.2s
        swPhase: (i * 0.9) % (Math.PI * 2),
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
      ctx.globalCompositeOperation = 'lighter' // 어두운 수면 위 가산 글로우 = 빛남
      for (const s of sparks) {
        // 날카로운 명멸: sin→0~1 정규화 후 세제곱 → 대부분 어둡고 피크에서만 짧게 번쩍
        const sv = Math.sin((t / s.twPeriod) * Math.PI * 2 + s.twPhase) * 0.5 + 0.5
        const a = sv * sv * sv * 0.9 // 0~0.9
        if (a < 0.012) continue
        const dx = Math.sin((t / s.swPeriod) * Math.PI * 2 + s.swPhase) * s.swayAmp
        const x = s.x * w + dx
        const y = s.y * h
        const glow = s.r * 2.4
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(s.sx, 1) // 가로 타원 — 수면 반사광 줄무늬
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, glow)
        g.addColorStop(0, `rgba(${s.color}, ${a})`)
        g.addColorStop(0.4, `rgba(${s.color}, ${a * 0.45})`)
        g.addColorStop(1, `rgba(${s.color}, 0)`)
        ctx.beginPath()
        ctx.arc(0, 0, glow, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
        ctx.restore()
      }
      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(frame)
    }
    const onVisibility = () => {
      if (document.hidden) {
        if (raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
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

  return <canvas className="water-shimmer__canvas" ref={canvasRef} aria-hidden="true" />
}
