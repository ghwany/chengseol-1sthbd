import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { usePointer } from './usePointer.js'

let rafQueue = []
beforeEach(() => {
  rafQueue = []
  vi.stubGlobal('requestAnimationFrame', (cb) => { rafQueue.push(cb); return rafQueue.length })
  vi.stubGlobal('cancelAnimationFrame', () => {})
})
afterEach(() => vi.unstubAllGlobals())

// rAF 큐를 n번 플러시(lerp 가 목표에 수렴하도록)
function flush(n) {
  for (let i = 0; i < n; i++) {
    const q = rafQueue
    rafQueue = []
    q.forEach((cb) => cb())
  }
}

function setup(enabled) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 })
  const hook = renderHook(() => {
    const ref = useRef(el)
    usePointer(ref, enabled)
    return ref
  })
  return { el, hook }
}

describe('usePointer', () => {
  it('enabled=false 면 변수를 0 으로 둠', () => {
    const { el } = setup(false)
    expect(el.style.getPropertyValue('--pointer-x')).toBe('0')
    expect(el.style.getPropertyValue('--pointer-y')).toBe('0')
  })

  it('enabled=true + 우측 이동 → --pointer-x 가 양수로 수렴', () => {
    const { el } = setup(true)
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 100, clientY: 50 }))
    flush(40)
    const x = parseFloat(el.style.getPropertyValue('--pointer-x'))
    expect(x).toBeGreaterThan(0.5)
  })
})
