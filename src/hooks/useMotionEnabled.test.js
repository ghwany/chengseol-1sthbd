import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMotionEnabled } from './useMotionEnabled.js'

function mockMatchMedia(map) {
  vi.stubGlobal('matchMedia', (query) => ({
    matches: !!map[query],
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

beforeEach(() => vi.unstubAllGlobals())

describe('useMotionEnabled', () => {
  it('마우스 + 모션 허용 → pointerMotion·ambientMotion 모두 true', () => {
    mockMatchMedia({ '(pointer: fine)': true, '(prefers-reduced-motion: reduce)': false })
    const { result } = renderHook(() => useMotionEnabled())
    expect(result.current.pointerMotion).toBe(true)
    expect(result.current.ambientMotion).toBe(true)
  })

  it('터치(coarse) → pointerMotion false, ambientMotion true', () => {
    mockMatchMedia({ '(pointer: fine)': false, '(prefers-reduced-motion: reduce)': false })
    const { result } = renderHook(() => useMotionEnabled())
    expect(result.current.pointerMotion).toBe(false)
    expect(result.current.ambientMotion).toBe(true)
  })

  it('reduced-motion → 둘 다 false', () => {
    mockMatchMedia({ '(pointer: fine)': true, '(prefers-reduced-motion: reduce)': true })
    const { result } = renderHook(() => useMotionEnabled())
    expect(result.current.pointerMotion).toBe(false)
    expect(result.current.ambientMotion).toBe(false)
  })
})
