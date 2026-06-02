import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages 프로젝트 페이지: base 는 반드시 '/chengseol-1sthbd/' (에셋 404 방지)
// esbuild.jsx: 'automatic' — vitest 2.x 는 내부 Vite 5(nested)를 사용하므로
// plugin-react@6(Vite 8/rolldown 전용)의 JSX 트랜스폼이 테스트 환경에 적용되지 않음.
// esbuild 레벨에서 automatic 런타임을 강제하여 JSX 테스트 파일을 올바르게 변환.
export default defineConfig({
  plugins: [react()],
  base: '/chengseol-1sthbd/',
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
