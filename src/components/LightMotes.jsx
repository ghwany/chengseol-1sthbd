import { useEffect, useRef } from 'react'

/**
 * 여름 윤슬(물 위 햇빛 반짝임) — 전용 canvas 1레이어. (스펙 §5-1)
 * 위로 흐르는 드리프트 폐기 → 제자리 반짝임. 수면 반사광처럼
 *  (a) 가로로 길쭉한 빛줄기(타원 글로우), (b) 빠르고 날카로운 명멸(twinkle),
 *  (c) 잔물결을 따르는 미세 수평 흔들림(sway). 수직 이동 0.
 * 색: 청록(=accent) ~60% + 금빛(=gold) ~40%. 합성 source-over.
 *   (배경 #E4EEF1이 근-흰색이라 화이트/연청록은 묻혀 안 보임 → 배경 대비
 *    분명한 청록·금빛 톤. 'lighter'는 워시아웃되므로 금지.)
 *
 * 탭 숨김 시 정지(visibilitychange). canvas 2d 미지원이면 조용히 생략.
 * 결정적 분포(황금비 저불일치 수열) — Math.random 미사용. 어느 count에서도 가로 균등.
 * reduced-motion 시엔 App이 ambientMotion=false로 unmount → RAF 미시작(완전 정지).
 */

// 글린트 색(rgba 베이스) — a는 매 프레임 opacity 펄스값으로 채움. (스펙 §5-1)
// 근-흰 배경(#E4EEF1)에서 분명히 식별되려면 배경보다 어두운/채도 있는 색이어야 함.
const GLINTS = [
  '19, 107, 120', // 청록 = --color-accent (배경 대비 분명)
  '156, 124, 69', // 금빛 = --color-gold
  '122, 95, 52', // 진한 금빛 = darken 포인트
]
// 청록 우세 ~60% + 금빛 ~40% : 청록은 근-흰 배경에서 대비가 커 분명히 보임.
const COLOR_PATTERN = [0, 0, 0, 1, 2]
// 황금비 — 저불일치(low-discrepancy) 수열로 x를 균등 분포(작은 count에서도 군집 없음).
const GOLDEN = 0.6180339887

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

    // 결정적 입자. x=황금비 균등, y=3개 가로 띠(수면 결). 빛줄기는 가로로 길쭉(sx배).
    const motes = []
    for (let i = 0; i < count; i++) {
      const u = ((i * 31) % 17) / 17 // 0~1 의사난수(결정적)
      const v = ((i * 53) % 19) / 19
      // y: 0.04~0.96 안에 3개의 느슨한 가로 띠로 클러스터링(수면 결)
      const band = (i % 3) / 2 // 0, 0.5, 1
      const y = 0.16 + band * 0.6 + (v - 0.5) * 0.18
      motes.push({
        x: (i * GOLDEN + 0.13) % 1, // 황금비 균등 분포(오른쪽 군집 버그 해소)
        y: Math.min(0.96, Math.max(0.04, y)),
        r: 1.4 + u * 1.6, // 세로 반경 1.4~3.0px (가로는 sx배로 늘어남)
        sx: 2.2 + u * 1.6, // 가로 늘임 2.2~3.8배 — 수면 반사 줄무늬
        color: GLINTS[COLOR_PATTERN[i % COLOR_PATTERN.length]],
        // twinkle: 빠르고 날카로운 명멸(주기 800~1800ms). 페이드 아닌 "반짝".
        twPeriod: 0.8 + u * 1.0,
        twPhase: (i * 1.3) % (Math.PI * 2),
        // sway: 잔물결 일렁임. 진폭 ±2~4px, 주기 2000~3500ms
        swayAmp: 2.0 + v * 2.0,
        swPeriod: 2.0 + ((i * 7) % 10) / 10 * 1.5, // 2.0~3.5초
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
      // source-over(기본) — 'lighter'는 근-흰 배경에서 워시아웃되므로 금지. (스펙 §5-1)
      for (const m of motes) {
        // 날카로운 명멸: sin을 0~1로 정규화 후 세제곱 → 대부분 어둡고 짧게 번쩍("반짝").
        const s = Math.sin((t / m.twPeriod) * Math.PI * 2 + m.twPhase) * 0.5 + 0.5
        const a = 0.04 + s * s * s * 0.62 // 0.04~0.66, 피크에서만 잠깐 밝음
        // sway: 잔물결 따라 미세 수평 흔들림(수직 이동 0)
        const dx = Math.sin((t / m.swPeriod) * Math.PI * 2 + m.swPhase) * m.swayAmp
        const x = m.x * w + dx
        const y = m.y * h
        // 가로로 길쭉한 빛줄기(타원 글로우) — 작은 코어 + 흐려지는 헤일로. (스펙 §5-1)
        const glow = m.r * 2.6
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(m.sx, 1) // 가로 타원 — 수면 반사광 줄무늬
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glow)
        grad.addColorStop(0, `rgba(${m.color}, ${a})`)
        grad.addColorStop(0.35, `rgba(${m.color}, ${a * 0.5})`)
        grad.addColorStop(1, `rgba(${m.color}, 0)`)
        ctx.beginPath()
        ctx.arc(0, 0, glow, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.restore()
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
