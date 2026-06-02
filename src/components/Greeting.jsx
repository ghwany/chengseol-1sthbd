import Reveal from './Reveal.jsx'
import { DancheongGlyph, CornerBrackets } from './motifs.jsx'
import { content } from '../content.js'

/** Greeting — 인사말. surface 카드 + 꽃살문 모서리 브래킷 + 제목 곁 연화. (스펙 §4-2, §8) */
export default function Greeting() {
  const { greeting } = content

  return (
    <section className="section">
      <Reveal className="card card--surface greeting">
        <CornerBrackets />
        <h2 className="section-title serif greeting__title">
          <span className="title-with-glyph">
            <DancheongGlyph size={22} />
            {greeting.title}
          </span>
        </h2>

        {greeting.body ? (
          <p className="greeting__body">{greeting.body}</p>
        ) : (
          <p className="slot-note">인사말 문구 준비 중입니다.</p>
        )}

        {greeting.parents ? (
          <p className="greeting__parents serif">{greeting.parents}</p>
        ) : null}
      </Reveal>
    </section>
  )
}
