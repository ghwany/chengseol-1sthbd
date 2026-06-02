import { useEffect, useState } from 'react'

function read() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return { reducedMotion: false, pointerFine: false }
  }
  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    pointerFine: window.matchMedia('(pointer: fine)').matches,
  }
}

/**
 * 접근성·기기 조건으로 모션 허용 범위를 한 곳에서 판정.
 * - pointerMotion: 마우스 추적 효과(빛망울 추적·대칭 반응) 허용
 * - ambientMotion: 스크롤/입자/호흡 등 ambient 효과 허용
 */
export function useMotionEnabled() {
  const [state, setState] = useState(read)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const queries = ['(prefers-reduced-motion: reduce)', '(pointer: fine)']
    const mqls = queries.map((q) => window.matchMedia(q))
    const update = () => setState(read())
    mqls.forEach((m) => m.addEventListener('change', update))
    return () => mqls.forEach((m) => m.removeEventListener('change', update))
  }, [])

  return {
    reducedMotion: state.reducedMotion,
    pointerFine: state.pointerFine,
    pointerMotion: state.pointerFine && !state.reducedMotion,
    ambientMotion: !state.reducedMotion,
  }
}
