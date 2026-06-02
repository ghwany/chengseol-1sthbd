import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages 프로젝트 페이지: base 는 반드시 '/chengseol-1sthbd/' (에셋 404 방지)
export default defineConfig({
  plugins: [react()],
  base: '/chengseol-1sthbd/',
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
