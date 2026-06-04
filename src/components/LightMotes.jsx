import { useEffect, useRef } from 'react'

/**
 * 여름 윤슬(물 위 햇빛 반짝임) — 전용 canvas 1레이어. (스펙 §5-1)
 * 위로 흐르는 드리프트 폐기 → 제자리 글린트: sin 위상 opacity 펄스(twinkle)
 * + 미세 수평 흔들림(sway). 수직 이동 0. 수면 결 느낌의 가로 우세 분포.
 * 색: 청록(=accent) ~40% + 금빛(=gold) ~40% + 진한 금빛 ~20%. 합성 source-over.
 *   (배경 #E4EEF1이 근-흰색이라 화이트/연청록은 묻혀 안 보임 → 배경 대비
 *    분명한 청록·금빛 톤으로 트윙클. "밝은 sparkle"이 아닌 "연청록·금빛 반짝임".)
 *
 * 탭 숨김 시 정지(visibilitychange). canvas 2d 미지원이면 조용히 생략.
 * 결정적 분포(인덱스 기반) — Math.random 미사용으로 안정.
 * reduced-motion 시엔 App이 ambientMotion=false로 unmount → RAF 미시작(완전 정지).
 */

// 글린트 색(rgba 베이스) — a는 매 프레임 opacity 펄스값으로 채움. (스펙 §5-1)
// 근-흰 배경(#E4EEF1)에서 분명히 식별되려면 배경보다 어두운/채도 있는 색이어야 함.
const GLINTS = [
  '19, 107, 120', // 청록 = --color-accent (배경 대비 분명)
  '156, 124, 69', // 금빛 = --color-gold
  '122, 95, 52', // 진한 금빛 = darken 포인트
]
// 청록 우세 ~60% + 금빛 ~40% : 청록은 근-흰 배경에서 대비가 커 분명히 보이고,
// 금빛은 대비가 약하므로 비중을 낮춰 "은은하지만 분명히" 균형을 맞춘다.
const COLOR_PATTERN = [0, 0, 0, 1, 2]

export default function LightMotes({ enabled = true, count = 12 }) {
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

    // 결정적 입자 — twinkle 주기 2200~3800ms, sway 진폭 ±1.5~3px / 주기 3000~5000ms.
    // 가로 우세 분포: x는 골고루, y는 느슨한 가로 띠(약한 클러스터링)로 흩음.
    const motes = []
    for (let i = 0; i < count; i++) {
      const u = ((i * 31) % 17) / 17 // 0~1 의사난수(결정적)
      const v = ((i * 53) % 19) / 19
      // y: 0.12~0.88 안에 3개의 느슨한 가로 띠로 클러스터링(수면 결)
      const band = (i % 3) / 2 // 0, 0.5, 1
      const y = 0.16 + band * 0.6 + (v - 0.5) * 0.18
      motes.push({
        x: ((i * 97) % 100) / 100,
        y: Math.min(0.96, Math.max(0.04, y)),
        r: 1.6 + u * 2.0, // 1.6~3.6px (근-흰 배경에서 식별되도록 상향)
        color: GLINTS[COLOR_PATTERN[i % COLOR_PATTERN.length]],
        // twinkle: 주기 2200~3800ms → 각속도 rad/s = 2π / (period/1000)
        twPeriod: 2.2 + u * 1.6, // 초 단위 2.2~3.8
        twPhase: (i * 1.3) % (Math.PI * 2),
        // sway: 진폭 1.5~3px, 주기 3000~5000ms
        swayAmp: 1.5 + v * 1.5,
        swPeriod: 3.0 + ((i * 7) % 10) / 10 * 2.0, // 3.0~5.0초
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
      t += 0.016 // ≈16ms/frame(초 단위 누적)
      ctx.clearRect(0, 0, w, h)
      // source-over(기본) — 근-흰 배경에선 'lighter'(빛 더하기)가 워시아웃되어
      // 묻히므로 일반 합성으로 색 대비를 살린다. (스펙 §5-1)
      for (const m of motes) {
        // opacity 펄스 0.05~0.65 사이 sin 왕복(최저점 0.05 — "사라졌다 반짝" 살림)
        const tw = Math.sin((t / m.twPeriod) * Math.PI * 2 + m.twPhase)
        const a = 0.35 + tw * 0.3 // 중앙 0.35 ± 0.3 → 0.05~0.65
        // sway: 미세 수평 흔들림(수직 이동 0)
        const dx = Math.sin((t / m.swPeriod) * Math.PI * 2 + m.swPhase) * m.swayAmp
        const x = m.x * w + dx
        const y = m.y * h
        // 부드러운 radial glow(빛무리) — 작은 코어 + 흐려지는 헤일로.
        // 단색 점은 근-흰 배경에서 미약 → glow로 "은은하지만 분명히" 식별. (스펙 §5-1)
        const glow = m.r * 2.6
        const grad = ctx.createRadialGradient(x, y, 0, x, y, glow)
        grad.addColorStop(0, `rgba(${m.color}, ${a})`)
        grad.addColorStop(0.35, `rgba(${m.color}, ${a * 0.5})`)
        grad.addColorStop(1, `rgba(${m.color}, 0)`)
        ctx.beginPath()
        ctx.arc(x, y, glow, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
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

  return <canvas className="motes" ref={canvasRef} aria-hidden="true" />
}
