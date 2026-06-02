import Reveal from './Reveal.jsx'
import Photo from './Photo.jsx'
import { ArrowDownIcon } from './icons.jsx'
import { content } from '../content.js'

/**
 * Hero — 쌍둥이 대칭의 핵심.
 * 두 이름은 동일 크기·동일 위계. 모바일 세로 스택, ≥768px 가로 나란히(동일 폭 컬럼).
 * 로드 즉시 fade-up, stagger 100ms (라벨→이름→부제→날짜→사진). (스펙 §4-1, §5)
 */
export default function Hero() {
  const { hero, date, babies } = content

  return (
    <header className="section hero">
      <Reveal immediate delay={0} className="hero__label label">
        {hero.label}
      </Reveal>

      {/* 두 이름 동시 등장(대칭 유지) — 한쪽 먼저 X.
          매듭(knot)은 두 이름의 형제 요소로 가운데에 둠 → 양쪽 동일 폭 컬럼 대칭. */}
      <Reveal immediate delay={100} className="hero__names">
        <span className="hero__name-wrap">
          <span className="hero__name serif">{babies[0].name}</span>
        </span>
        <span className="hero__knot" aria-hidden="true" />
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

      <Reveal immediate delay={400} className="hero__photo">
        <div className="photo-mat">
          <Photo
            src={hero.heroPhoto}
            ratio="4 / 5"
            label="청아 · 설아"
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
