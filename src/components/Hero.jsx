import Reveal from './Reveal.jsx'
import Photo from './Photo.jsx'
import WaterShimmer from './WaterShimmer.jsx'
import { ArrowDownIcon } from './icons.jsx'
import { DancheongGlyph, KnotVertical, FlowerLatticeWatermark } from './motifs.jsx'
import { useMotionEnabled } from '../hooks/useMotionEnabled.js'
import { content } from '../content.js'

/**
 * Hero — 쌍둥이 대칭의 핵심.
 * 두 이름은 동일 크기·동일 위계. 모바일 세로 스택, ≥768px 가로 나란히(동일 폭 컬럼).
 * 로드 즉시 fade-up, stagger 100ms (라벨→이름→부제→날짜→사진). (스펙 §4-1, §5)
 */
export default function Hero() {
  const { hero, date, babies } = content
  const { pointerMotion, ambientMotion } = useMotionEnabled()

  return (
    <header className="section hero">
      {/* 배경 꽃살문 워터마크(옥색 2~3%) — 콘텐츠 레이어 내부, 배경 빛과 분리 */}
      <FlowerLatticeWatermark />

      {/* 단청 1점 — hero 상단 */}
      <Reveal immediate delay={0} className="hero__dancheong">
        <DancheongGlyph size={30} />
      </Reveal>

      <Reveal immediate delay={50} className="hero__label label">
        {hero.label}
      </Reveal>

      {/* 두 이름 동시 등장(대칭 유지) — 한쪽 먼저 X.
          매듭(knot)은 두 이름의 형제 요소로 가운데에 둠 → 양쪽 동일 폭 컬럼 대칭. */}
      <Reveal immediate delay={100} className="hero__names">
        <span className="hero__name-wrap">
          <span className="hero__name serif">{babies[0].name}</span>
        </span>
        <span className="hero__knot" aria-hidden="true">
          <KnotVertical />
        </span>
        <span className="hero__name-wrap">
          <span className="hero__name serif">{babies[1].name}</span>
        </span>
      </Reveal>

      {hero.subtitle && (
        <Reveal immediate delay={200} className="hero__subtitle">
          {hero.subtitle}
        </Reveal>
      )}

      <Reveal immediate delay={300} className="hero__date serif">
        {date.year}. {date.monthDay}{' '}
        <span className="hero__weekday">({date.weekdayShort})</span>
      </Reveal>

      {/* 여름 윤슬 — 짙은 청록 "수면 띠"(어두운 바탕) 위에서만 흰·은빛 반짝임 명멸.
          띠(CSS)는 항상 표시, sparkle canvas는 ambientMotion일 때만(reduced-motion 정지). (스펙 §5-1) */}
      <div className="hero__water" aria-hidden="true">
        {ambientMotion && (
          <WaterShimmer enabled count={pointerMotion ? 90 : 50} />
        )}
      </div>

      <Reveal immediate delay={400} className="hero__photo">
        <div className="photo-mat">
          <Photo
            src={hero.heroPhoto}
            ratio="4 / 5"
            label="설아 · 청아"
            eager
          />
        </div>
      </Reveal>

      <div className="hero__scroll" aria-hidden="true">
        <ArrowDownIcon width={22} height={22} />
      </div>
    </header>
  )
}
