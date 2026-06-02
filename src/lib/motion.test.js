import { describe, it, expect } from 'vitest'
import { clamp, lerp, normalizePointer, scrollProgress } from './motion.js'

describe('clamp', () => {
  it('범위 안은 그대로', () => expect(clamp(0.5, 0, 1)).toBe(0.5))
  it('하한 클램프', () => expect(clamp(-2, -1, 1)).toBe(-1))
  it('상한 클램프', () => expect(clamp(2, -1, 1)).toBe(1))
})

describe('lerp', () => {
  it('t=0 이면 a', () => expect(lerp(0, 10, 0)).toBe(0))
  it('t=1 이면 b', () => expect(lerp(0, 10, 1)).toBe(10))
  it('t=0.5 이면 중간', () => expect(lerp(0, 10, 0.5)).toBe(5))
})

describe('normalizePointer', () => {
  const rect = { left: 0, top: 0, width: 100, height: 100 }
  it('중심은 0,0', () => {
    expect(normalizePointer(50, 50, rect)).toEqual({ x: 0, y: 0 })
  })
  it('우상단 경계는 +1,-1', () => {
    expect(normalizePointer(100, 0, rect)).toEqual({ x: 1, y: -1 })
  })
  it('범위 밖은 클램프', () => {
    expect(normalizePointer(200, 200, rect)).toEqual({ x: 1, y: 1 })
  })
  it('폭/높이 0 이면 0 반환(0 division 방지)', () => {
    expect(normalizePointer(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 0, y: 0 })
  })
})

describe('scrollProgress', () => {
  it('맨 위는 0', () => expect(scrollProgress(0, 2000, 1000)).toBe(0))
  it('맨 아래는 1', () => expect(scrollProgress(1000, 2000, 1000)).toBe(1))
  it('중간은 0.5', () => expect(scrollProgress(500, 2000, 1000)).toBe(0.5))
  it('스크롤 불가(문서≤뷰포트)면 0', () => expect(scrollProgress(0, 800, 1000)).toBe(0))
})
