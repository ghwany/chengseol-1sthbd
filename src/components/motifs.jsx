// =====================================================================
//  전통 장식 모티프 4종 — 전부 인라인 SVG/CSS. 래스터 에셋·추가 폰트 금지.
//  색은 currentColor / CSS 변수(--color-*)만. (스펙 §8)
//   1) 꽃살문/창살  2) 조각보(프레임은 CSS)  3) 단청  4) 매듭
//  draw-on/scale 등 모션 처리는 styles/motifs.css 에서. (스펙 §6)
// =====================================================================
import { useId } from 'react'
import { useReveal } from '../hooks/useReveal.js'

/**
 * 가로 구분선(reveal 연동) — 섹션 진입 시 draw-on(700ms).
 * 무늬 없는 단순 hairline. accent 면 className="motif-divider--accent".
 */
export function RevealDivider({ className = '' }) {
  const { ref, shown } = useReveal()
  return <LineDivider ref={ref} shown={shown} className={className} />
}

/**
 * 조각보 프레임(reveal 연동) — 진입 시 fade+scale 0.96→1.
 * side 'left'|'right' 로 거울 대칭 코너 탭 위치 결정. 사진을 덮지 않는 프레임.
 */
export function Jogakbo({ side = 'left', children }) {
  const { ref, shown } = useReveal()
  return (
    <div ref={ref} className={`jogakbo jogakbo--${side} ${shown ? 'is-shown' : ''}`}>
      {children}
    </div>
  )
}

/* ---------------------------------------------------------------------
   1) 꽃살문 / 창살 — 주 구조 장식
   --------------------------------------------------------------------- */

/**
 * 가로 구분선 — 무늬 없는 단순 hairline. 섹션 사이 구분선·마감용.
 * stroke = currentColor (호출부에서 color: line/accent 지정).
 * 진입 시 stroke-dashoffset draw-on(700ms) — .is-shown 토글로 발동.
 */
export function LineDivider({ shown = false, className = '', ref, ...rest }) {
  return (
    <div
      ref={ref}
      className={`motif-divider ${shown ? 'is-shown' : ''} ${className}`}
      aria-hidden="true"
      {...rest}
    >
      <svg
        className="motif-divider__svg"
        viewBox="0 0 240 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 가로 중심선(무늬 없음) */}
        <path className="dash" d="M0 4 H240" />
      </svg>
    </div>
  )
}

/**
 * 꽃살문 배경 워터마크 — hero/closing 배경. 옥색 2~3% opacity, pointer-events none.
 * 콘텐츠 흐름 레이어 안쪽(absolute), 배경 빛(z-back)과 분리.
 */
export function FlowerLatticeWatermark({ className = '' }) {
  // 인스턴스마다 고유 pattern id(중복 id 방지 — Hero·Closing 동시 렌더)
  const pid = useId().replace(/:/g, '') + '-lattice'
  return (
    <div className={`motif-watermark ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
      >
        <defs>
          {/* 완자살 단위 셀 — 타일 반복 */}
          <pattern id={pid} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 20 H40 M20 0 V40" />
            <rect x="10" y="10" width="20" height="20" />
            <path d="M10 20 H30 M20 10 V30" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="120" height="120" fill={`url(#${pid})`} />
      </svg>
    </div>
  )
}

/**
 * 카드 모서리 브래킷(꽃살문) — surface 카드 네 모서리. stroke = line/accent.
 */
export function CornerBrackets({ className = '' }) {
  const corner = (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
    >
      <path d="M2 10 V2 H10" />
      <path d="M2 6 H6 V2" />
      <path d="M10 10 L2 2" />
    </svg>
  )
  return (
    <span className={`motif-brackets ${className}`} aria-hidden="true">
      <span className="motif-brackets__c motif-brackets__c--tl">{corner}</span>
      <span className="motif-brackets__c motif-brackets__c--tr">{corner}</span>
      <span className="motif-brackets__c motif-brackets__c--bl">{corner}</span>
      <span className="motif-brackets__c motif-brackets__c--br">{corner}</span>
    </span>
  )
}

/* ---------------------------------------------------------------------
   3) 단청 — 연화·운문 미니 글리프 (오방색 절제)
   --------------------------------------------------------------------- */

/**
 * 단청 연화 글리프 — 섹션 제목 곁. 청록(accent)·적(highlight)·황(gold) 토큰 합성.
 * 면적 작게(포인트). 별도 hex 없음 — CSS 변수로 채색.
 */
export function DancheongGlyph({ size = 26, className = '', ...rest }) {
  return (
    <svg
      className={`motif-dancheong ${className}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      {/* 운문(구름) 바깥 호 — 청록 */}
      <path
        d="M5 19 q3 -4 8 -3 q-1 -5 3 -7 q4 2 3 7 q5 -1 8 3"
        stroke="var(--color-dancheong-blue)"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* 연화 꽃잎 — 황(gold) 외곽 */}
      <g stroke="var(--color-dancheong-yellow)" strokeWidth="1.2" fill="none" strokeLinejoin="round">
        <path d="M16 9 C13 12 13 16 16 18 C19 16 19 12 16 9 Z" />
        <path d="M16 18 C12 17 9 19 9 23 C13 23 16 22 16 18 Z" />
        <path d="M16 18 C20 17 23 19 23 23 C19 23 16 22 16 18 Z" />
      </g>
      {/* 화심 — 적(highlight) 1점(따뜻한 초점) */}
      <circle cx="16" cy="18" r="1.8" fill="var(--color-dancheong-red)" />
    </svg>
  )
}

/* ---------------------------------------------------------------------
   4) 매듭 — 도래/병아리매듭 라인 (gold stroke)
   --------------------------------------------------------------------- */

/**
 * 세로 매듭(hero 두 이름 사이) — gold stroke 라인 SVG.
 */
export function KnotVertical({ className = '', ...rest }) {
  return (
    <svg
      className={`motif-knot motif-knot--v ${className}`}
      viewBox="0 0 24 56"
      fill="none"
      stroke="var(--color-gold)"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {/* 위·아래 늘어뜨린 줄 + 가운데 도래매듭 고리 교차 */}
      <path d="M12 2 V12" />
      <path d="M12 44 V54" />
      <path d="M12 12 C6 16 6 24 12 28 C18 32 18 40 12 44" />
      <path d="M12 12 C18 16 18 24 12 28 C6 32 6 40 12 44" />
      <circle cx="12" cy="28" r="2.4" />
    </svg>
  )
}

/**
 * 가로 매듭 마감(섹션 마감 · Closing) — 좌우 늘어진 줄 + 중앙 매듭. gold.
 */
export function KnotHorizontal({ className = '', ...rest }) {
  return (
    <svg
      className={`motif-knot motif-knot--h ${className}`}
      viewBox="0 0 120 28"
      fill="none"
      stroke="var(--color-gold)"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d="M4 14 H44" />
      <path d="M76 14 H116" />
      <path d="M44 14 C50 8 54 8 60 14 C66 20 70 20 76 14" />
      <path d="M44 14 C50 20 54 20 60 14 C66 8 70 8 76 14" />
      <circle cx="60" cy="14" r="2.6" />
    </svg>
  )
}
