import { useEffect, useRef, useState } from 'react'

/**
 * IntersectionObserver 기반 스크롤 등장 훅.
 * 뷰포트 15% 진입 시 1회 등장(반복 없음). (디자인 스펙 §5)
 *
 * @param {object} opts
 * @param {boolean} opts.immediate - true 면 로드 즉시 등장(Hero 용).
 * @returns {{ ref: React.RefObject, shown: boolean }}
 */
export function useReveal({ immediate = false } = {}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current

    // immediate(Hero) 또는 IntersectionObserver 미지원 → 다음 프레임에 즉시 등장.
    // (setState 를 effect 동기 호출하지 않도록 rAF 로 다음 프레임에 전환)
    if (immediate || !el || typeof IntersectionObserver === 'undefined') {
      const id = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(id)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [immediate])

  return { ref, shown }
}
