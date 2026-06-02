import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import HanokBackdrop from './HanokBackdrop.jsx'

afterEach(cleanup)

describe('HanokBackdrop', () => {
  it('빛 변화 3겹 + 처마 2겹 + 빛망울 1개를 렌더', () => {
    const { container } = render(<HanokBackdrop />)
    expect(container.querySelectorAll('.backdrop__light').length).toBe(3)
    expect(container.querySelectorAll('.backdrop__eaves').length).toBe(2)
    expect(container.querySelector('.backdrop__bloom')).not.toBeNull()
  })
  it('aria-hidden 으로 스크린리더에서 숨김', () => {
    const { container } = render(<HanokBackdrop />)
    expect(container.querySelector('.backdrop').getAttribute('aria-hidden')).toBe('true')
  })
})
