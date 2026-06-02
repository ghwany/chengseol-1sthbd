# 설계 스펙 — 하지의 빛 인터랙션 레이어

**날짜:** 2026-06-02
**대상:** 김청아·김설아 첫 생일 초대장 (`baby-1st-hbd`, Vite+React, GitHub Pages)
**범위:** 인터랙션 주도 + 핀포인트 비주얼 강화 (한옥 베이스 유지)

---

## 1. 목표

기존 한옥 전통 모던 초대장에 **"하지의 빛"** 을 주제로 한 마우스/휠 인터랙션 레이어를 더한다. 6월 20일(가장 긴 낮)과 쌍둥이 대칭을 모티프로 삼되, 초대장의 품격과 모바일 성능·가독성을 해치지 않는다.

**성공 기준**
- 데스크톱: 마우스·휠 연출이 또렷한 첫인상(Hero)을 주고 본문은 은은하다.
- 모바일(360px, 카카오톡 인앱 포함): 가로 스크롤·잰크·끊김 0. 모든 효과가 스크롤/ambient 동등 연출로 자연 degrade.
- `prefers-reduced-motion` 존중, Lighthouse 모바일 성능 회귀 없음, 번들 의존성 0 추가.
- 기존 콘텐츠·쌍둥이 균형·대비비·base 경로 전부 불변.

---

## 2. 브레인스토밍 결정 요약

| 항목 | 결정 |
|------|------|
| 플랫폼 전략 | 데스크톱 풀(마우스 패럴랙스+휠) + 모바일 동등 연출. **모바일 안정성 최우선** |
| 개편 범위 | 인터랙션 주도 + 핀포인트 강화 (레이아웃/구조/팔레트 유지) |
| 테마 | **하지의 빛** (가장 긴 낮·따뜻한 햇살, 한옥 처마 그림자와 결합) |
| 채택 효과 | A 빛망울 · B 처마 패럴랙스 · C 스크롤 빛 변화 · D 두 이름 대칭 반응 · G 빛 입자 |
| 강도 | 강약 조절 — Hero 또렷 → 본문 은은 |
| 구현 방식 | 경량 바닐라 (라이브러리 0, CSS 변수 + rAF + 작은 canvas) |
| 제외(YAGNI) | E 갤러리 3D 틸트, F 휠 스냅, 사운드, 라이트박스 |

---

## 3. 기존 디자인 스펙과의 관계 — **모션 계약(§5) 갱신**

> ⚠️ 본 스펙은 `_workspace/01_design_spec.md` **§5(애니메이션/스크롤 연출)를 갱신·대체**한다. 구현·QA는 충돌 시 본 스펙을 우선한다. (이를 명시하지 않으면 QA가 새 패럴랙스/ambient 루프를 옛 §5 위반으로 플래그함.)

**갱신된 모션 원칙**
1. **진입 애니메이션은 여전히 1회 재생** (fade-up reveal, Hero stagger 등 — 기존 유지).
2. **미세 패럴랙스 허용**: 처마 레이어 이동량 상한 — 데스크톱 마우스 패럴랙스 **최대 ±12px**, 모바일 스크롤 패럴랙스 **최대 ±20px**. 옛 "강한 패럴랙스 금지"는 *미세 범위로 제한*하는 형태로 유지(과한 깊이·빠른 이동 금지).
3. **ambient 무한 루프 허용 대상(한정)**: 빛 입자(G) 드리프트, 모바일에서 두 이름 호흡(D), 기존 스크롤 화살표. 모두 **주기 ≥ 4s·미세·GPU-only(transform/opacity)**. 옛 "무한 회전 금지"는 유지(회전 루프 없음).
4. **전부 `prefers-reduced-motion: reduce`에서 정지**.
5. **유지되는 금지**: 자동재생 사운드, 깜빡임, 강한/빠른 패럴랙스, 무한 회전.

---

## 4. 효과 명세 (A·B·C·D·G)

각 효과는 **composite-only(transform/opacity)** 로 구현한다. 매 프레임 gradient color-stop·레이아웃·넓은 영역 paint를 갱신하지 않는다(모바일 잰크 방지의 핵심).

### A. 빛망울 커서 (Light bloom)
- **기법:** 미리 칠해둔 고정 크기 radial-gradient 레이어(div) 1개를 `transform: translate3d(var(--pointer-x), var(--pointer-y), 0)`로 **이동만**. gradient 자체는 재계산 안 함. 섹션별 강도는 레이어 `opacity`로 조절.
- **데스크톱:** 따뜻한 햇살 빛망울이 커서를 부드럽게(lerp) 따라옴. Hero에서 가장 밝고, 본문에선 배경에 옅게.
- **모바일(확정):** 커서 추적 없음 → 빛망울을 **화면 상단 65% 지점에 고정**하고 `--scroll-progress`에 따라 세로로만 아주 느리게 이동(별도 ambient 루프 없음).

### B. 처마 그림자 패럴랙스 (깊이감)
- **기법:** 처마 SVG 실루엣 2~3겹을 절대배치, 각 레이어 `transform: translate3d()` only. 레이어별 계수 차이로 깊이.
- **데스크톱:** `--pointer-x/y`에 비례해 미세 이동(상한 ±12px).
- **모바일(확정):** `--scroll-progress`에 비례해 세로 시차 이동(상한 ±20px). 마우스 미사용.

### C. 스크롤 빛 변화 (아침→정오→해질녘)
- **기법:** 하루의 빛 단계(아침/정오/해질녘)를 **미리 칠한 풀스크린 레이어 3장**을 겹쳐두고, `--scroll-progress`로 각 레이어 **opacity 크로스페이드**(composite-only). 단일 그라데이션의 color-stop을 매 프레임 바꾸지 않음.
- **공통(데스크톱·모바일 동일):** Hero=아침빛 → Gallery 부근=정오빛(가장 환함) → Closing=해질녘. 전부 한지 팔레트(`#FAF4EA` 계열) 안에서 절제.

### D. 두 이름 대칭 반응 (쌍둥이)
- **기법:** Hero의 김청아·김설아에 **거울 대칭** transform(한쪽 `+`, 한쪽 `−`) — translate/rotate only.
- **데스크톱:** `--pointer-x/y`에 따라 두 이름이 반대 방향으로 미세하게 기울고 떠오름(균형 저울). 회전 상한 ±4deg, 이동 상한 ±6px.
- **모바일(확정):** 마우스 없음 → 두 이름이 **좌우 대칭 호흡 루프**(주기 ≥4s, 매우 미세, 반대 위상). reduced-motion 시 정지.

### G. 빛 입자 (햇살 속 먼지)
- **기법:** 전용 `<canvas>` 레이어. 입자 **상한 ~20개**, 매우 느린 드리프트. `visibilitychange`로 탭 숨김 시 정지, 뷰포트 밖이면 정지. canvas 미지원 시 조용히 생략.
- **데스크톱:** 햇살 속 먼지처럼 떠다니고, 커서 근처에서 살짝 흩어짐(미세).
- **모바일(확정):** 아주 느린 ambient 드리프트만(커서 상호작용 없음), 입자 수 더 축소(예 ~12개).

---

## 5. 섹션별 효과 강도 + 모바일 동작 맵

◉ 또렷 · ◐ 은은 · ○ 시작점 · — 없음

| 섹션 | A 빛망울 | B 패럴랙스 | C 빛변화 | D 대칭 | G 입자 | 모바일 동작 요지 |
|------|:---:|:---:|:---:|:---:|:---:|------|
| Hero | ◉ | ◉ | ○ 아침 | ◉ | ◐ | 빛망울 상단 고정, 패럴랙스=스크롤시차, 두 이름 대칭 호흡 |
| Greeting~Location | ◐ 배경 | ◐ | ◉ 진행 | — | ◐ 극소량 | 스크롤 빛 변화 중심, 입자 최소 |
| Closing | ◐ | ◐ | ◉ 해질녘 | ◉ 재등장 | ◐ | 두 이름 대칭 호흡 재현, 해질녘 빛 |

> 지도 영역(Location iframe/링크)은 조작·가독을 위해 **효과 비적용**.

---

## 6. 아키텍처 — CSS 변수 버스(bus)

입력(포인터·스크롤)을 JS가 rAF로 받아 CSS 커스텀 프로퍼티에 발행하고, 스타일이 그 변수를 읽어 **transform/opacity로만** 그린다. JS↔CSS 단방향, React 리렌더 없음.

**원칙 (paint vs composite)**
- 매 프레임 변경은 **transform/opacity로 한정**(compositor-only). gradient color-stop·width/height·top/left·box-shadow 등 paint/layout 유발 속성을 매 프레임 건드리지 않는다.
- 빛망울·빛 변화는 "미리 칠한 레이어를 이동/크로스페이드"로 구현(§4 A·C).
- `will-change: transform`은 해당 레이어에만 절제 적용.

**CSS 변수 스코프**
- `--pointer-x`, `--pointer-y`: **Hero/backdrop 컨테이너에 스코프**(전역 `:root` 금지 — 전역 변수는 그 변수를 읽는 모든 노드의 style 재계산을 매 프레임 유발).
- `--scroll-progress`: 스크롤은 전역이므로 루트 또는 앱 컨테이너에 둠.

---

## 7. 컴포넌트 / 파일 구조 (각 단일 책임)

**신규**
- `src/hooks/usePointer.js` — pointermove를 rAF throttle + lerp → `--pointer-x/y` 발행. `(pointer: coarse)`·reduced-motion이면 비활성(no-op).
- `src/hooks/useScrollProgress.js` — passive 스크롤/rAF → `--scroll-progress`(0~1). 빛 변화(C)·모바일 패럴랙스 구동.
- `src/hooks/useMotionEnabled.js` — reduced-motion + 포인터 종류를 1곳에서 판정(다른 훅/컴포넌트가 참조).
- `src/components/HanokBackdrop.jsx` — 처마 다층 패럴랙스(B) + 빛망울 레이어(A) + 빛 변화 레이어 3장(C). CSS 변수만 읽는 순수 표현 레이어.
- `src/components/LightMotes.jsx` — 빛 입자(G) canvas. 상한·정지 로직 포함.

**수정**
- `src/components/Hero.jsx` — 두 이름 거울 대칭 transform(D) 연결.
- `src/App.jsx` — `HanokBackdrop`·`LightMotes` 마운트, 모션 enable 컨텍스트/훅 제공.
- `src/styles/global.css`, `src/styles/components.css` — CSS 변수 정의, 빛 레이어, reduced-motion 게이팅.

**기존 재사용:** `src/hooks/useReveal.js`(진입 등장, 변경 없음).

---

## 8. 데이터 흐름

```
pointermove / scroll
   → rAF throttle (usePointer / useScrollProgress)
   → CSS 변수(--pointer-x/y, --scroll-progress) 갱신
   → 스타일이 transform/opacity로 paint (HanokBackdrop / Hero / LightMotes)
```
상태 전달은 전적으로 CSS 변수. React state·리렌더 경로 없음.

---

## 9. 에러 처리 · 접근성 · 성능

- **reduced-motion:** 포인터 추적·패럴랙스·입자·대칭 호흡 전부 정지. 정적 정오빛 + 즉시 등장만.
- **터치(`pointer: coarse`):** 마우스 추적 생략 → 빛망울 고정·스크롤 동등 연출. **모바일 가로 스크롤·잰크 0 최우선.**
- **성능:** transform/opacity만, `will-change` 절제, 입자 상한+오프스크린/숨김 정지, passive 리스너, rAF throttle. Lighthouse 모바일 성능 회귀 없게.
- **정적 호스팅:** 100% 클라이언트, 새 런타임 의존 0, base 경로 영향 없음. canvas 미지원 시 입자 조용히 생략.

---

## 10. 범위 제외 (YAGNI)

갤러리 3D 틸트(E), 휠 스냅 전환(F), 사운드, 라이트박스, 지도 영역 효과. 추후 별도 요청 시 재검토.

---

## 11. 테스트 · 검증

**게이트(기존 QA 기준 유지)**
- `npm run build` 통과, base 경로 에셋 404 없음, `dist/index.html` 링크 `/chengseol-1sthbd/` 유지.

**신규 검증**
- 데스크톱: 마우스 이동 시 빛망울 추적·처마 패럴랙스·두 이름 대칭 반응 동작, 휠 스크롤 시 빛 변화 진행.
- 모바일 360px: 가로 스크롤·잰크 없음, 효과가 스크롤/ambient로 degrade, 두 이름 대칭 호흡 동작.
- `prefers-reduced-motion`: 모든 모션 정지 확인.
- Lighthouse 모바일 성능 미회귀(가능 시 정량, 불가 시 수동 점검 + 명시).
- 기존 콘텐츠·쌍둥이 균형(청아=설아)·대비비(본문 ≥4.5:1) 불변.

**수행 주체:** 기존 하네스 `design-director → frontend-developer → qa-reviewer` 파이프라인(서브 에이전트 모드).

---

## 12. 배포

구현→빌드→QA 통과 후 **사용자 인증 git push**가 필요하다(이전과 동일 경로: 토큰 `repo`+`workflow` 스코프, `github-pages` 환경 브랜치 보호 규칙 확인). push 시 GitHub Actions가 자동 빌드·배포 → `https://ghwany.github.io/chengseol-1sthbd/`.
