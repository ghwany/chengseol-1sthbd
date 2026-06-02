import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { useScrollProgress } from './useScrollProgress.js'

let rafQueue = []
beforeEach(() => {
  rafQueue = []
  vi.stubGlobal('requestAnimationFrame', (cb) => { rafQueue.push(cb); return rafQueue.length })
  vi.stubGlobal('cancelAnimationFrame', () => {})
})
afterEach(() => vi.unstubAllGlobals())

function flush() {
  const q = rafQueue
  rafQueue = []
  q.forEach((cb) => cb())
}

describe('useScrollProgress', () => {
  it('스크롤 위치를 --scroll-progress(0..1)로 발행', () => {
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000)
    window.innerHeight = 1000
    window.scrollY = 500

    const el = document.createElement('div')
    renderHook(() => {
      const ref = useRef(el)
      useScrollProgress(ref)
      return ref
    })
    flush()
    window.scrollY = 500
    window.dispatchEvent(new Event('scroll'))
    flush()

    expect(parseFloat(el.style.getPropertyValue('--scroll-progress'))).toBeCloseTo(0.5, 2)
  })
})
