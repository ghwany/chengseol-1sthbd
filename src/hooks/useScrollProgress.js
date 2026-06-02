import { useEffect } from 'react'
import { scrollProgress } from '../lib/motion.js'

/**
 * 페이지 스크롤 진행도(0..1)를 rAF throttle 로 대상 요소의
 * --scroll-progress CSS 변수에 발행한다. (passive 리스너)
 */
export function useScrollProgress(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const apply = () => {
      raf = 0
      const p = scrollProgress(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight,
      )
      el.style.setProperty('--scroll-progress', p.toFixed(4))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    apply() // 초기값
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref])
}
