import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import App from './App.jsx'

beforeEach(() => {
  vi.stubGlobal('matchMedia', (q) => ({
    matches: false, media: q, addEventListener: () => {}, removeEventListener: () => {},
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('App', () => {
  it('app-root + backdrop + invitation 을 함께 렌더', () => {
    const { container } = render(<App />)
    expect(container.querySelector('.app-root')).not.toBeNull()
    expect(container.querySelector('.backdrop')).not.toBeNull()
    expect(container.querySelector('.invitation')).not.toBeNull()
  })
  it('확정 콘텐츠(두 이름)가 여전히 표시됨', () => {
    const { getAllByText } = render(<App />)
    expect(getAllByText(/김청아|김설아/).length).toBeGreaterThan(0)
  })
})
