import { useEffect, useRef } from 'react'

/**
 * 여름 윤슬(물 위 햇빛 반짝임) — 전용 canvas 1레이어. (스펙 §5-1)
 * 위로 흐르는 드리프트 폐기 → 제자리 글린트: sin 위상 opacity 펄스(twinkle)
 * + 미세 수평 흔들림(sway). 수직 이동 0. 수면 결 느낌의 가로 우세 분포.
 * 색: 화이트 ~40% + 연청록(=line) ~40% + 금빛(=gold) ~20%. 합성 'lighter'.
 *
 * 탭 숨김 시 정지(visibilitychange). canvas 2d 미지원이면 조용히 생략.
 * 결정적 분포(인덱스 기반) — Math.random 미사용으로 안정.
 * reduced-motion 시엔 App이 ambientMotion=false로 unmount → RAF 미시작(완전 정지).
 */

// 글린트 색(rgba 베이스) — a는 매 프레임 opacity 펄스값으로 채움. (스펙 §5-1)
const GLINTS = [
  '255, 255, 255', // 화이트
  '187, 211, 217', // 연청록 = --color-line 톤
  '156, 124, 69', // 금빛 = --color-gold
]
// 분포 ~40% / ~40% / ~20% : 인덱스 5주기로 white,white,teal,teal,gold
const COLOR_PATTERN = [0, 0, 1, 1, 2]

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
        r: 0.8 + u * 1.4, // 0.8~2.2px
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
      ctx.globalCompositeOperation = 'lighter' // 빛 더하기 — 윤슬 반짝임감
      for (const m of motes) {
        // opacity 펄스 0.10~0.55 사이 sin 왕복(최저점 0.1 바닥 — 완전히 사라지지 않음)
        const tw = Math.sin((t / m.twPeriod) * Math.PI * 2 + m.twPhase)
        const a = 0.325 + tw * 0.225 // 중앙 0.325 ± 0.225 → 0.10~0.55
        // sway: 미세 수평 흔들림(수직 이동 0)
        const dx = Math.sin((t / m.swPeriod) * Math.PI * 2 + m.swPhase) * m.swayAmp
        const x = m.x * w + dx
        const y = m.y * h
        ctx.beginPath()
        ctx.arc(x, y, m.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${m.color}, ${a})`
        ctx.fill()
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

  return <canvas className="motes" ref={canvasRef} aria-hidden="true" />
}
