import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 프로젝트 페이지: https://ghwany.github.io/chengseol-1sthbd/
// base 는 REPO 이름과 정확히 일치해야 하며 슬래시 양끝 필수. (에셋 404 방지)
export default defineConfig({
  plugins: [react()],
  base: '/chengseol-1sthbd/',
})
