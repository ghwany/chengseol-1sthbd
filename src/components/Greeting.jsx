import Reveal from './Reveal.jsx'
import { content } from '../content.js'

/** Greeting — 인사말. surface 카드. (스펙 §4-2) */
export default function Greeting() {
  const { greeting } = content

  return (
    <section className="section">
      <Reveal className="card card--surface greeting">
        <h2 className="section-title serif greeting__title">{greeting.title}</h2>

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
