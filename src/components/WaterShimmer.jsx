import { useEffect, useRef } from 'react'

/**
 * 여름 윤슬 — 전역 배경에 은은하게 흐르는 "빛 일렁임"(water caustics).
 * 점(sparkle)이 아니라 면(연속 그라데이션)이다: 밝은 한지 배경 위에서 점은
 * 안 보이거나 '먼지'로 보였다 → 수면을 통과한 빛이 부드럽게 흐르는 밝고 옅은
 * 결(수영장 바닥 빛무늬)로 표현. 어두운 수면 불필요, 전체 배경에 잔잔히 깔림.
 *
 *  - 큰 저투명 그라데이션 블롭 여러 겹이 느리게 떠다니며 겹쳐 빛 결을 만든다(per-pixel 아님).
 *  - 색: 흰끼(밝은 결) + 옅은 청록(그늘 결). 변조 진폭을 낮게 묶어 본문 대비(≥4.5:1) 유지.
 *  - 결정적(Math.random 미사용). reduced-motion 시 부모가 enabled=false → 미렌더.
 */

// 빛 결 색(rgba 베이스). 밝은 결=흰끼(밝은 배경에선 약함), 그늘 결=청록(대비 담당).
// 청록 비중을 높여 "물에 빛이 일렁이는" 결이 실제로 보이게 한다(가독성 한계 내).
const TINTS = [
  '116, 172, 190', // 청록 결(그늘 — 대비 담당)
  '255, 255, 255', // 밝은 빛 결
  '138, 186, 200', // 청록 결
  '116, 172, 190',
]

export default function WaterShimmer({ enabled = true, count = 14 }) {
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

    // 큰 빛 블롭 — 가로로 길쭉(수면 결은 가로 우세), 느리게 떠다니며 약하게 맥동.
    const blobs = []
    for (let i = 0; i < count; i++) {
      const u = ((i * 31) % 17) / 17
      const v = ((i * 53) % 19) / 19
      const g = ((i * 0.6180339887 + 0.13) % 1) // 균등
      blobs.push({
        bx: g, // 0~1
        by: ((i * 0.3819660113 + 0.29) % 1),
        rx: 0.22 + u * 0.16, // 화면폭의 22~38% (큰 면)
        ry: 0.1 + v * 0.08, // 가로로 길쭉(rx > ry)
        color: TINTS[i % TINTS.length],
        op: 0.13 + u * 0.11, // 0.13~0.24 (보이되 가독성 유지)
        ampX: 0.05 + v * 0.06, // 가로 우세 드리프트
        ampY: 0.02 + u * 0.03,
        spdX: 0.05 + u * 0.05, // 매우 느림(주기 ~수십 초)
        spdY: 0.04 + v * 0.04,
        phX: (i * 1.7) % (Math.PI * 2),
        phY: (i * 0.9) % (Math.PI * 2),
        opSpd: 0.06 + v * 0.05,
        opPh: (i * 1.3) % (Math.PI * 2),
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
      for (const b of blobs) {
        const x = (b.bx + Math.sin(t * b.spdX + b.phX) * b.ampX) * w
        const y = (b.by + Math.cos(t * b.spdY + b.phY) * b.ampY) * h
        const op = b.op * (0.55 + 0.45 * (Math.sin(t * b.opSpd + b.opPh) * 0.5 + 0.5))
        const rx = b.rx * w
        const ry = b.ry * h
        const rad = Math.max(rx, ry)
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(1, ry / rx) // 가로로 길쭉한 타원
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
        grad.addColorStop(0, `rgba(${b.color}, ${op})`)
        grad.addColorStop(0.6, `rgba(${b.color}, ${op * 0.35})`)
        grad.addColorStop(1, `rgba(${b.color}, 0)`)
        ctx.beginPath()
        ctx.arc(0, 0, rx, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.restore()
        void rad
      }
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

  return <canvas className="water-caustics" ref={canvasRef} aria-hidden="true" />
}
