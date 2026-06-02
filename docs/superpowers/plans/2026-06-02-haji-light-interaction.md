# 하지의 빛 인터랙션 레이어 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 한옥 감성 쌍둥이 초대장에 "하지의 빛" 마우스/휠 인터랙션 5종(A 빛망울·B 처마 패럴랙스·C 스크롤 빛 변화·D 두 이름 대칭·G 빛 입자)을 라이브러리 없이 더한다.

**Architecture:** 입력(포인터·스크롤)을 rAF로 받아 App 루트 래퍼의 CSS 커스텀 프로퍼티(`--pointer-x/y`, `--scroll-progress`)에 발행하고, 스타일은 그 변수를 **transform/opacity로만**(composite-only) 읽어 그린다. JS↔CSS 단방향, React 리렌더 없음. 변수는 루트 래퍼에 스코프해 backdrop과 Hero가 상속한다(`:root` 회피).

**Tech Stack:** Vite + React (런타임 의존성 0 추가), 순수 JS 헬퍼, `<canvas>` 입자. 테스트는 dev 전용 vitest + jsdom + @testing-library/react(번들 영향 없음).

**기준 스펙:** `docs/superpowers/specs/2026-06-02-haji-light-interaction-design.md`

> **커밋 규칙:** 각 커밋 메시지 끝에 다음 트레일러를 붙인다 — `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` (아래 예시에서는 생략).

---

## File Structure

**신규**
- `src/lib/motion.js` — 순수 헬퍼: `clamp`, `lerp`, `normalizePointer`, `scrollProgress`. 부작용 없음.
- `src/lib/motion.test.js` — 위 헬퍼 단위 테스트.
- `src/hooks/useMotionEnabled.js` — matchMedia로 reduced-motion·포인터 종류 판정 → `{ pointerMotion, ambientMotion }`.
- `src/hooks/useMotionEnabled.test.js`
- `src/hooks/usePointer.js` — pointermove를 rAF throttle+lerp → 대상 요소에 `--pointer-x/y` 발행.
- `src/hooks/usePointer.test.js`
- `src/hooks/useScrollProgress.js` — 스크롤을 rAF throttle → `--scroll-progress` 발행.
- `src/hooks/useScrollProgress.test.js`
- `src/components/HanokBackdrop.jsx` — 빛 변화(C)·처마 패럴랙스(B)·빛망울(A) 표현 레이어. CSS 변수만 읽음.
- `src/components/HanokBackdrop.test.jsx`
- `src/components/LightMotes.jsx` — 빛 입자(G) canvas. 입자 상한·오프스크린/숨김 정지.
- `src/components/LightMotes.test.jsx`
- `src/styles/interactions.css` — 인터랙션 변수·레이어·대칭 반응(D)·reduced-motion/coarse 게이팅.

**수정**
- `src/App.jsx` — 루트 래퍼 + 모션 훅 마운트 + Backdrop/Motes 렌더.
- `src/main.jsx` — `interactions.css` import.
- `package.json` — vitest/jsdom/@testing-library devDeps + test 스크립트.
- `vite.config.js` — vitest(jsdom) 테스트 설정.

**변경 없음:** `Hero.jsx` (대칭 반응 D는 기존 `.hero__name-wrap` 마크업에 CSS로만 적용).

---

### Task 1: 테스트 인프라 설정 (vitest + jsdom)

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `src/lib/sanity.test.js` (설정 검증용, 이후 삭제)

- [ ] **Step 1: dev 의존성 설치**

Run:
```bash
npm install -D vitest@^2 jsdom@^25 @testing-library/react@^16 @testing-library/dom@^10
```
Expected: `added N packages`. 런타임 `dependencies`가 아닌 `devDependencies`에 추가됨(번들 영향 없음).

- [ ] **Step 2: `vite.config.js`를 vitest 설정 포함으로 교체**

`vite.config.js` 전체를 아래로 교체:
```js
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
```
(`vitest/config`의 `defineConfig`는 vite 설정을 그대로 확장하므로 `npm run build`에 영향 없음.)

- [ ] **Step 3: `package.json`에 test 스크립트 추가**

`package.json`의 `"scripts"` 객체에 추가:
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 4: 설정 검증용 sanity 테스트 작성**

`src/lib/sanity.test.js`:
```js
import { describe, it, expect } from 'vitest'

describe('test infra', () => {
  it('runs and has jsdom document', () => {
    expect(typeof document).toBe('object')
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: 테스트 실행해 통과 확인**

Run: `npm test`
Expected: PASS (1 passed). jsdom 환경에서 `document`가 객체로 인식되면 설정 성공.

- [ ] **Step 6: 빌드가 여전히 통과하는지 확인**

Run: `npm run build`
Expected: 성공. `dist/index.html`의 링크가 `/chengseol-1sthbd/assets/...`인지 확인.

- [ ] **Step 7: sanity 테스트 삭제 후 커밋**

```bash
rm src/lib/sanity.test.js
git add package.json package-lock.json vite.config.js
git commit -m "chore: vitest + jsdom 테스트 인프라 설정"
```

---

### Task 2: 순수 모션 헬퍼 (`src/lib/motion.js`)

**Files:**
- Create: `src/lib/motion.js`
- Test: `src/lib/motion.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/motion.test.js`:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- motion`
Expected: FAIL ("Failed to resolve import './motion.js'" 또는 함수 미정의).

- [ ] **Step 3: 최소 구현 작성**

`src/lib/motion.js`:
```js
/** 값을 [min, max] 범위로 제한 */
export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

/** 선형 보간: t=0 → a, t=1 → b */
export function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * 요소(rect) 기준으로 포인터를 -1..1 로 정규화. 중심=0, 우/하=+1, 좌/상=-1.
 * 폭·높이가 0 이면 0 division 을 피해 0 반환.
 */
export function normalizePointer(clientX, clientY, rect) {
  const halfW = rect.width / 2
  const halfH = rect.height / 2
  const x = halfW === 0 ? 0 : clamp((clientX - (rect.left + halfW)) / halfW, -1, 1)
  const y = halfH === 0 ? 0 : clamp((clientY - (rect.top + halfH)) / halfH, -1, 1)
  return { x, y }
}

/** 페이지 세로 스크롤 진행도 0..1. 스크롤 불가 시 0. */
export function scrollProgress(scrollY, scrollHeight, viewportHeight) {
  const max = scrollHeight - viewportHeight
  if (max <= 0) return 0
  return clamp(scrollY / max, 0, 1)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- motion`
Expected: PASS (전부 통과).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/motion.js src/lib/motion.test.js
git commit -m "feat: 순수 모션 헬퍼(clamp/lerp/normalizePointer/scrollProgress)"
```

---

### Task 3: 모션 가능 여부 훅 (`useMotionEnabled`)

**Files:**
- Create: `src/hooks/useMotionEnabled.js`
- Test: `src/hooks/useMotionEnabled.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/hooks/useMotionEnabled.test.js`:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- useMotionEnabled`
Expected: FAIL (import 실패/함수 미정의).

- [ ] **Step 3: 최소 구현 작성**

`src/hooks/useMotionEnabled.js`:
```js
import { useEffect, useState } from 'react'

function read() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return { reducedMotion: false, pointerFine: false }
  }
  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    pointerFine: window.matchMedia('(pointer: fine)').matches,
  }
}

/**
 * 접근성·기기 조건으로 모션 허용 범위를 한 곳에서 판정.
 * - pointerMotion: 마우스 추적 효과(빛망울 추적·대칭 반응) 허용
 * - ambientMotion: 스크롤/입자/호흡 등 ambient 효과 허용
 */
export function useMotionEnabled() {
  const [state, setState] = useState(read)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const queries = ['(prefers-reduced-motion: reduce)', '(pointer: fine)']
    const mqls = queries.map((q) => window.matchMedia(q))
    const update = () => setState(read())
    mqls.forEach((m) => m.addEventListener('change', update))
    return () => mqls.forEach((m) => m.removeEventListener('change', update))
  }, [])

  return {
    reducedMotion: state.reducedMotion,
    pointerFine: state.pointerFine,
    pointerMotion: state.pointerFine && !state.reducedMotion,
    ambientMotion: !state.reducedMotion,
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- useMotionEnabled`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/useMotionEnabled.js src/hooks/useMotionEnabled.test.js
git commit -m "feat: useMotionEnabled — reduced-motion/포인터 종류 판정"
```

---

### Task 4: 포인터 훅 (`usePointer`)

**Files:**
- Create: `src/hooks/usePointer.js`
- Test: `src/hooks/usePointer.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/hooks/usePointer.test.js`:
```js
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
    expect(x).toBeGreaterThan(0.5) // 중심 위(y=50)=0 근처, 우측=+1 로 수렴
  })
})
```
> 참고: jsdom에 `PointerEvent`가 없을 수 있어 `MouseEvent('pointermove', ...)`로 디스패치한다(`clientX/Y` 전달됨).

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- usePointer`
Expected: FAIL (함수 미정의).

- [ ] **Step 3: 최소 구현 작성**

`src/hooks/usePointer.js`:
```js
import { useEffect } from 'react'
import { lerp, normalizePointer } from '../lib/motion.js'

/**
 * window pointermove 를 rAF throttle + lerp(0.12) 로 부드럽게 받아
 * 대상 요소에 --pointer-x / --pointer-y (-1..1) CSS 변수를 발행한다.
 * enabled=false 면 변수를 0 으로 고정하고 리스너를 달지 않는다.
 */
export function usePointer(ref, enabled) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!enabled) {
      el.style.setProperty('--pointer-x', '0')
      el.style.setProperty('--pointer-y', '0')
      return
    }
    let raf = 0
    let curX = 0, curY = 0
    let tgtX = 0, tgtY = 0

    const tick = () => {
      curX = lerp(curX, tgtX, 0.12)
      curY = lerp(curY, tgtY, 0.12)
      el.style.setProperty('--pointer-x', curX.toFixed(4))
      el.style.setProperty('--pointer-y', curY.toFixed(4))
      if (Math.abs(curX - tgtX) > 0.001 || Math.abs(curY - tgtY) > 0.001) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
      }
    }
    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const n = normalizePointer(e.clientX, e.clientY, rect)
      tgtX = n.x
      tgtY = n.y
      if (!raf) raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref, enabled])
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- usePointer`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/usePointer.js src/hooks/usePointer.test.js
git commit -m "feat: usePointer — pointermove를 CSS 변수(--pointer-x/y)로 발행"
```

---

### Task 5: 스크롤 진행도 훅 (`useScrollProgress`)

**Files:**
- Create: `src/hooks/useScrollProgress.js`
- Test: `src/hooks/useScrollProgress.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/hooks/useScrollProgress.test.js`:
```js
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
    // 문서 2000, 뷰포트 1000 → 최대 스크롤 1000
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000)
    window.innerHeight = 1000
    window.scrollY = 500

    const el = document.createElement('div')
    renderHook(() => {
      const ref = useRef(el)
      useScrollProgress(ref)
      return ref
    })
    flush() // 초기 apply 가 rAF 없이 즉시 실행되지만, scroll 이벤트 경로도 검증
    window.scrollY = 500
    window.dispatchEvent(new Event('scroll'))
    flush()

    expect(parseFloat(el.style.getPropertyValue('--scroll-progress'))).toBeCloseTo(0.5, 2)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- useScrollProgress`
Expected: FAIL (함수 미정의).

- [ ] **Step 3: 최소 구현 작성**

`src/hooks/useScrollProgress.js`:
```js
import { useEffect } from 'react'
import { scrollProgress } from '../lib/motion.js'

/**
 * 페이지 스크롤 진행도(0..1)를 rAF throttle 로 대상 요소의
 * --scroll-progress CSS 변수에 발행한다. (passive 리스너)
 */
export function useScrollProgress(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const apply = () => {
      raf = 0
      const p = scrollProgress(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight,
      )
      el.style.setProperty('--scroll-progress', p.toFixed(4))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    apply() // 초기값
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref])
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- useScrollProgress`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/useScrollProgress.js src/hooks/useScrollProgress.test.js
git commit -m "feat: useScrollProgress — 스크롤 진행도를 --scroll-progress로 발행"
```

---

### Task 6: 인터랙션 스타일 (`interactions.css`) — A·B·C·D 게이팅

**Files:**
- Create: `src/styles/interactions.css`

> 시각 효과라 단위 테스트 대신 빌드 통과 + Task 10 QA로 검증한다. CSS는 매 프레임 transform/opacity만 변경(composite-only). 좌표 상한: 패럴랙스 마우스 ±12px·스크롤 ±20px, 대칭 반응 회전 ±4deg·이동 ±6px (스펙 §4).

- [ ] **Step 1: `src/styles/interactions.css` 작성**

```css
/* =====================================================================
   하지의 빛 인터랙션 레이어 — composite-only(transform/opacity)만 매 프레임 변경.
   변수는 .app-root 에 스코프(usePointer/useScrollProgress 가 발행).
   기준: docs/superpowers/specs/2026-06-02-haji-light-interaction-design.md
   ===================================================================== */

.app-root {
  /* 변수 기본값 — JS 미동작/SSR 시에도 안전 */
  --pointer-x: 0;
  --pointer-y: 0;
  --scroll-progress: 0;
  position: relative;
}

/* ---- 화면 고정 배경 레이어 (콘텐츠 뒤) ---- */
.backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
.backdrop > * {
  position: absolute;
  inset: 0;
  will-change: transform, opacity;
}

/* C. 스크롤 빛 변화 — 미리 칠한 3장을 opacity 크로스페이드.
   morning(바닥) → dusk(중간) → noon(위, 중앙에서 가장 환함). */
.backdrop__light--morning {
  background: radial-gradient(120% 90% at 50% 18%, #FBF1DD 0%, #FAF4EA 60%);
  opacity: calc(1 - var(--scroll-progress, 0));
}
.backdrop__light--dusk {
  background: radial-gradient(120% 90% at 50% 82%, #F4E2CC 0%, #EFDAC1 70%);
  opacity: var(--scroll-progress, 0);
}
.backdrop__light--noon {
  background: radial-gradient(90% 70% at 50% 40%, rgba(255, 250, 235, 0.9) 0%, rgba(255, 250, 235, 0) 65%);
  /* 0→0.5→0 포물선: p*(1-p)*4 (단위 없는 number 곱 → opacity 유효) */
  opacity: calc(var(--scroll-progress, 0) * (1 - var(--scroll-progress, 0)) * 4);
}

/* B. 처마 패럴랙스 — 부드러운 그림자 띠(에셋 없이). transform 만 변경.
   마우스 ±12px, 스크롤 ±20px 상한. far(약)·near(강) 2겹. */
.backdrop__eaves {
  left: -20%;
  right: -20%;
  width: 140%;
  height: 46%;
  background: linear-gradient(180deg, rgba(58, 50, 43, 0.10) 0%, rgba(58, 50, 43, 0) 100%);
}
.backdrop__eaves--far {
  top: -6%;
  transform: translate3d(
    calc(var(--pointer-x, 0) * 5px),
    calc(var(--scroll-progress, 0) * 10px),
    0
  );
  opacity: 0.6;
}
.backdrop__eaves--near {
  top: -10%;
  height: 30%;
  transform: translate3d(
    calc(var(--pointer-x, 0) * 12px),
    calc(var(--scroll-progress, 0) * 20px),
    0
  );
  opacity: 0.8;
}

/* A. 빛망울 — 미리 칠한 radial 레이어를 transform 이동만.
   기본 (50vw, 35vh) 고정, 데스크톱은 포인터 따라 이동. 스크롤 내려가면 옅어짐. */
.backdrop__bloom {
  inset: auto;
  width: 70vmax;
  height: 70vmax;
  margin-left: -35vmax;
  margin-top: -35vmax;
  background: radial-gradient(circle, rgba(255, 246, 224, 0.55) 0%, rgba(255, 246, 224, 0) 60%);
  transform: translate3d(
    calc(50vw + var(--pointer-x, 0) * 28vw),
    calc(35vh + var(--pointer-y, 0) * 22vh + var(--scroll-progress, 0) * 8vh),
    0
  );
  opacity: calc(0.9 - var(--scroll-progress, 0) * 0.45);
}

/* G. 빛 입자 canvas — 전체 고정, 콘텐츠 뒤(backdrop 위, 텍스트 아래). */
.motes {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
.invitation {
  position: relative;
  z-index: 1; /* 입자/배경 위에 콘텐츠 */
}

/* D. 두 이름 대칭 반응 — 기존 .hero__name-wrap 2개에 거울 대칭 transform.
   knot(가운데 span)은 변형 없음. 마우스(fine)에서만 포인터 반응. */
@media (pointer: fine) {
  .hero__names .hero__name-wrap:first-of-type {
    transform: translate(calc(var(--pointer-x, 0) * 6px), calc(var(--pointer-y, 0) * -6px))
      rotate(calc(var(--pointer-x, 0) * -4deg));
    will-change: transform;
  }
  .hero__names .hero__name-wrap:last-of-type {
    transform: translate(calc(var(--pointer-x, 0) * -6px), calc(var(--pointer-y, 0) * 6px))
      rotate(calc(var(--pointer-x, 0) * 4deg));
    will-change: transform;
  }
}

/* D(모바일). 터치 기기는 좌우 대칭 호흡 루프(반대 위상, 주기 5s, 미세). */
@media (pointer: coarse) {
  .hero__names .hero__name-wrap:first-of-type {
    animation: nameBreatheL 5s ease-in-out infinite;
  }
  .hero__names .hero__name-wrap:last-of-type {
    animation: nameBreatheR 5s ease-in-out infinite;
  }
}
@keyframes nameBreatheL {
  0%, 100% { transform: translateY(0) rotate(-0.6deg); }
  50% { transform: translateY(-3px) rotate(0.6deg); }
}
@keyframes nameBreatheR {
  0%, 100% { transform: translateY(0) rotate(0.6deg); }
  50% { transform: translateY(-3px) rotate(-0.6deg); }
}

/* 접근성: reduced-motion 시 인터랙션 레이어 정지·고정(정오빛 기준). (스펙 §3·§9)
   global.css 의 전역 reduced-motion 블록과 함께 동작. */
@media (prefers-reduced-motion: reduce) {
  .backdrop__bloom,
  .backdrop__eaves--far,
  .backdrop__eaves--near {
    transform: none !important;
  }
  .backdrop__light--morning { opacity: 0 !important; }
  .backdrop__light--dusk { opacity: 0 !important; }
  .backdrop__light--noon { opacity: 1 !important; } /* 정적 정오빛 */
  .motes { display: none !important; }
  .hero__names .hero__name-wrap:first-of-type,
  .hero__names .hero__name-wrap:last-of-type {
    animation: none !important;
    transform: none !important;
  }
}
```

- [ ] **Step 2: 빌드로 CSS 유효성 확인**

Run: `npm run build`
Expected: 성공(CSS 파싱 에러 없음). 아직 import 전이라 화면 변화는 없음 — 다음 태스크에서 연결.

- [ ] **Step 3: 커밋**

```bash
git add src/styles/interactions.css
git commit -m "feat: interactions.css — 빛망울/패럴랙스/빛변화/대칭 + 게이팅"
```

---

### Task 7: 배경 레이어 컴포넌트 (`HanokBackdrop`)

**Files:**
- Create: `src/components/HanokBackdrop.jsx`
- Test: `src/components/HanokBackdrop.test.jsx`

- [ ] **Step 1: 실패하는 렌더 테스트 작성**

`src/components/HanokBackdrop.test.jsx`:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- HanokBackdrop`
Expected: FAIL (모듈 없음).

- [ ] **Step 3: 최소 구현 작성**

`src/components/HanokBackdrop.jsx`:
```jsx
/**
 * 화면 고정 배경 인터랙션 레이어. CSS 변수(--pointer-x/y, --scroll-progress)만 읽는
 * 순수 표현 컴포넌트(자체 상태/이벤트 없음). 변수 발행은 App 의 훅이 담당.
 * - 빛 변화(C): morning/noon/dusk 3겹 opacity 크로스페이드
 * - 처마 패럴랙스(B): far/near 2겹 transform
 * - 빛망울(A): bloom 1겹 transform 이동
 */
export default function HanokBackdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__light backdrop__light--morning" />
      <div className="backdrop__light backdrop__light--dusk" />
      <div className="backdrop__light backdrop__light--noon" />
      <div className="backdrop__eaves backdrop__eaves--far" />
      <div className="backdrop__eaves backdrop__eaves--near" />
      <div className="backdrop__bloom" />
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- HanokBackdrop`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/components/HanokBackdrop.jsx src/components/HanokBackdrop.test.jsx
git commit -m "feat: HanokBackdrop — 빛/패럴랙스/빛망울 배경 레이어"
```

---

### Task 8: 빛 입자 canvas (`LightMotes`)

**Files:**
- Create: `src/components/LightMotes.jsx`
- Test: `src/components/LightMotes.test.jsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/LightMotes.test.jsx`:
```js
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
    // jsdom 의 getContext 는 null → 조용히 생략되어야 함
    expect(() => render(<LightMotes enabled />)).not.toThrow()
  })
  it('enabled=false 면 애니메이션 시작 안 함(렌더만)', () => {
    expect(() => render(<LightMotes enabled={false} />)).not.toThrow()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- LightMotes`
Expected: FAIL (모듈 없음).

- [ ] **Step 3: 최소 구현 작성**

`src/components/LightMotes.jsx`:
```jsx
import { useEffect, useRef } from 'react'

/**
 * 햇살 속 먼지 같은 빛 입자(G). 전용 canvas, 입자 상한·매우 느린 드리프트.
 * 탭 숨김 시 정지(visibilitychange). canvas 2d 미지원이면 조용히 생략.
 * 결정적 분포(인덱스 기반) — Math.random 미사용으로 안정.
 */
export default function LightMotes({ enabled = true, count = 18 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext && canvas.getContext('2d')
    if (!ctx) return // jsdom 등 미지원 → 생략

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0, h = 0, raf = 0, t = 0
    const motes = []
    for (let i = 0; i < count; i++) {
      motes.push({
        x: ((i * 97) % 100) / 100,
        y: ((i * 53) % 100) / 100,
        r: 0.6 + (((i * 31) % 10) / 10) * 1.4,
        sp: 0.015 + (((i * 17) % 10) / 10) * 0.03, // 매우 느림
        ph: (i * 0.7) % (Math.PI * 2),
      })
    }

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, w * dpr)
      canvas.height = Math.max(1, h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const frame = () => {
      t += 0.016
      ctx.clearRect(0, 0, w, h)
      for (const m of motes) {
        const x = m.x * w + Math.sin(t * m.sp * 6 + m.ph) * 8
        const yRaw = (m.y - (t * m.sp)) % 1
        const y = ((yRaw % 1) + 1) % 1 * h
        ctx.beginPath()
        ctx.arc(x, y, m.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(176, 138, 79, 0.16)' // gold 극옅게
        ctx.fill()
      }
      raf = requestAnimationFrame(frame)
    }
    const onVisibility = () => {
      if (document.hidden) {
        if (raf) { cancelAnimationFrame(raf); raf = 0 }
      } else if (!raf) {
        raf = requestAnimationFrame(frame)
      }
    }

    resize()
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', resize, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, count])

  return <canvas className="motes" ref={canvasRef} aria-hidden="true" />
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- LightMotes`
Expected: PASS (3 passed).

- [ ] **Step 5: 커밋**

```bash
git add src/components/LightMotes.jsx src/components/LightMotes.test.jsx
git commit -m "feat: LightMotes — 빛 입자 canvas(상한·정지·미지원 가드)"
```

---

### Task 9: App 통합 + CSS import

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/main.jsx`
- Test: `src/App.test.jsx` (신규)

- [ ] **Step 1: 통합 렌더 테스트 작성**

`src/App.test.jsx`:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- App`
Expected: FAIL (`.app-root`/`.backdrop` 없음 — 아직 미통합).

- [ ] **Step 3: `src/App.jsx` 교체**

```jsx
import { useRef } from 'react'
import Hero from './components/Hero.jsx'
import Greeting from './components/Greeting.jsx'
import Gallery from './components/Gallery.jsx'
import DatePlace from './components/DatePlace.jsx'
import Location from './components/Location.jsx'
import Closing from './components/Closing.jsx'
import HanokBackdrop from './components/HanokBackdrop.jsx'
import LightMotes from './components/LightMotes.jsx'
import { useMotionEnabled } from './hooks/useMotionEnabled.js'
import { usePointer } from './hooks/usePointer.js'
import { useScrollProgress } from './hooks/useScrollProgress.js'

export default function App() {
  const rootRef = useRef(null)
  const { pointerMotion, ambientMotion } = useMotionEnabled()

  // 변수는 .app-root 에 발행 → backdrop·Hero 가 상속(:root 회피)
  usePointer(rootRef, pointerMotion)
  useScrollProgress(rootRef)

  return (
    <div className="app-root" ref={rootRef}>
      <HanokBackdrop />
      {ambientMotion && <LightMotes enabled count={18} />}
      <div className="invitation">
        <Hero />
        <Greeting />
        <Gallery />
        <DatePlace />
        <Location />
        <Closing />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: `src/main.jsx`에 interactions.css import 추가**

`src/main.jsx`에서 스타일 import 줄에 한 줄 추가(기존 두 줄 아래):
```js
import './styles/global.css'
import './styles/components.css'
import './styles/interactions.css'
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- App`
Expected: PASS.

- [ ] **Step 6: 전체 테스트 + 빌드 확인**

Run: `npm test`
Expected: 전부 PASS.

Run: `npm run build`
Expected: 성공. `dist/index.html`의 JS/CSS 링크가 `/chengseol-1sthbd/assets/...`인지 확인(에셋 404 방지).

- [ ] **Step 7: 커밋**

```bash
git add src/App.jsx src/App.test.jsx src/main.jsx
git commit -m "feat: App 통합 — backdrop/motes 마운트 + 포인터/스크롤 훅"
```

---

### Task 10: 빌드/배포 QA 검증 + 핸드오프

**Files:** (코드 변경 없음 — 검증 단계)

- [ ] **Step 1: lint + 전체 테스트 + 빌드 게이트**

Run:
```bash
npm run lint
npm test
npm run build
```
Expected: lint 0 error, 테스트 전부 PASS, 빌드 성공.

- [ ] **Step 2: base 경로/에셋 무결성 확인**

Run:
```bash
npm run preview
```
다른 셸에서:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4173/chengseol-1sthbd/
grep -o '/chengseol-1sthbd/assets/[^"]*' dist/index.html
```
Expected: 메인 200, 에셋 링크가 전부 `/chengseol-1sthbd/...`. 바 `/assets/` 없음.

- [ ] **Step 3: QA 하네스로 정합성 검증 위임**

기존 하네스의 `qa-reviewer` 서브에이전트를 호출해 다음을 검증한다(Bash 실행 권한 필요, Explore 금지):
- 데스크톱: 마우스 이동 시 빛망울 추적·처마 패럴랙스·두 이름 대칭 반응 / 휠 스크롤 시 빛 변화 진행(헤드리스 Chrome로 `--pointer-x`/`--scroll-progress` 변수 변화 또는 transform 확인).
- 모바일 360px: 가로 스크롤·잰크 없음, 효과가 스크롤/ambient로 degrade, 두 이름 대칭 호흡.
- `prefers-reduced-motion: reduce` 에뮬레이션: backdrop transform 정지, motes 미표시, 이름 애니메이션 정지(`interactions.css`의 reduced-motion 블록 적용 확인).
- Lighthouse 모바일 성능(가능 시 정량, 불가 시 수동 점검 + "도구 미사용" 명시) — 기존 대비 회귀 없을 것.
- 기존 콘텐츠·쌍둥이 균형(청아=설아 동수)·대비비(본문 ≥4.5:1) 불변.

QA 리포트는 `_workspace/03_qa_report.md`에 보존(오케스트레이터 책임). blocker 0이어야 통과.

- [ ] **Step 4: 사용자 인증 배포**

> 자동 push 불가(사용자 GitHub 인증 필요). 사용자가 본인 터미널에서 실행:
```bash
git push
```
Username `ghwany`, Password = PAT(`repo`+`workflow` 스코프). push 시 GitHub Actions가 자동 빌드·배포.
배포 후 확인: `https://ghwany.github.io/chengseol-1sthbd/` 200, 에셋 404 없음, 인터랙션 동작.

> 이전 배포 시 막혔던 지점 재확인: 토큰 `workflow` 스코프, `github-pages` 환경의 배포 브랜치 보호 규칙(main 허용).

- [ ] **Step 5: 최종 커밋(있을 경우) 및 plan 완료 표시**

검증 단계라 신규 코드 커밋은 없을 수 있음. 후속 수정이 생기면 해당 태스크로 돌아가 커밋.

---

## Self-Review

**1. 스펙 커버리지 (스펙 §4 효과별):**
- A 빛망울 → Task 6(`.backdrop__bloom` transform), Task 7(렌더), Task 9(포인터 발행). ✓
- B 처마 패럴랙스 → Task 6(`.backdrop__eaves--far/near`, ±12/±20px), Task 7. ✓
- C 스크롤 빛 변화 → Task 6(morning/noon/dusk opacity), Task 5(--scroll-progress). ✓
- D 두 이름 대칭 → Task 6(pointer:fine 거울 transform + coarse 호흡 + reduced-motion 정지). ✓
- G 빛 입자 → Task 8(canvas 상한·정지·가드), Task 9(ambientMotion 게이트). ✓
- 모바일 동등/coarse → useMotionEnabled(Task 3) + CSS @media(Task 6). ✓
- composite-only(§6) → Task 6 transform/opacity만. ✓
- reduced-motion(§3·§9) → Task 6 블록 + global.css. ✓
- 정적 호스팅/base(§9·§12) → Task 1·9·10에서 base 유지 검증, 런타임 의존성 0. ✓
- 테스트/검증(§11) → Task 10 QA 하네스. ✓

**2. 플레이스홀더 스캔:** TBD/TODO/"적절히 처리" 없음. 각 코드 스텝에 완전한 코드 포함. ✓

**3. 타입/이름 일관성:**
- `usePointer(ref, enabled)`, `useScrollProgress(ref)`, `useMotionEnabled() → {pointerMotion, ambientMotion}` — Task 3·4·5 정의와 Task 9 사용처 일치. ✓
- CSS 변수명 `--pointer-x`/`--pointer-y`/`--scroll-progress` — 훅 발행(Task 4·5)과 CSS 소비(Task 6) 일치. ✓
- 클래스명 `.app-root`/`.backdrop`/`.backdrop__light|eaves|bloom`/`.motes`/`.hero__name-wrap` — CSS(Task 6)·컴포넌트(Task 7·8)·기존 Hero 마크업 일치. ✓
- `LightMotes` props `{enabled, count}` — Task 8 정의·Task 9 사용 일치. ✓

이슈 없음.

---

## Execution Handoff

계획서를 `docs/superpowers/plans/2026-06-02-haji-light-interaction.md`에 저장했습니다. 두 가지 실행 방식이 있습니다:

1. **Subagent-Driven (추천)** — 태스크마다 새 서브에이전트를 띄우고 태스크 사이에 리뷰, 빠른 반복.
2. **Inline Execution** — 이 세션에서 executing-plans로 체크포인트 단위 배치 실행.

어느 방식으로 진행할까요?
