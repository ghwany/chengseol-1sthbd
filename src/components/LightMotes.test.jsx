import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import LightMotes from './LightMotes.jsx'

afterEach(cleanup)

describe('LightMotes', () => {
  it('canvas 를 렌더하고 aria-hidden', () => {
    const { container } = render(<LightMotes enabled count={12} />)
    const canvas = container.querySelector('canvas.motes')
    expect(canvas).not.toBeNull()
    expect(canvas.getAttribute('aria-hidden')).toBe('true')
  })
  it('canvas 2d 컨텍스트 미지원(jsdom)이어도 throw 하지 않음', () => {
    expect(() => render(<LightMotes enabled />)).not.toThrow()
  })
  it('enabled=false 면 애니메이션 시작 안 함(렌더만)', () => {
    expect(() => render(<LightMotes enabled={false} />)).not.toThrow()
  })
})
