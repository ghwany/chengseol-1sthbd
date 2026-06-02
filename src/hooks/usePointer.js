import { useEffect } from 'react'
import { lerp, normalizePointer } from '../lib/motion.js'

/**
 * window pointermove 를 rAF throttle + lerp(0.12) 로 부드럽게 받아
 * 대상 요소에 --pointer-x / --pointer-y (-1..1) CSS 변수를 발행한다.
 * enabled=false 면 변수를 0 으로 고정하고 리스너를 달지 않는다.
 */
export function usePointer(ref, enabled) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!enabled) {
      el.style.setProperty('--pointer-x', '0')
      el.style.setProperty('--pointer-y', '0')
      return
    }
    let raf = 0
    let curX = 0, curY = 0
    let tgtX = 0, tgtY = 0

    const tick = () => {
      curX = lerp(curX, tgtX, 0.12)
      curY = lerp(curY, tgtY, 0.12)
      el.style.setProperty('--pointer-x', curX.toFixed(4))
      el.style.setProperty('--pointer-y', curY.toFixed(4))
      if (Math.abs(curX - tgtX) > 0.001 || Math.abs(curY - tgtY) > 0.001) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
      }
    }
    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const n = normalizePointer(e.clientX, e.clientY, rect)
      tgtX = n.x
      tgtY = n.y
      if (!raf) raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref, enabled])
}
