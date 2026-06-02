import Reveal from './Reveal.jsx'
import { content } from '../content.js'

/** Closing — 마무리. 두 이름 다시 대칭 표기. (스펙 §4-6) */
export default function Closing() {
  const { closing, babies } = content

  return (
    <footer className="section closing">
      <Reveal className="closing__inner">
        {closing.message ? (
          <p className="closing__message">{closing.message}</p>
        ) : (
          <p className="slot-note">마무리 인사 준비 중입니다.</p>
        )}

        {/* 두 이름 대칭 표기 — Hero 와 동일 위계. 가운뎃점은 두 이름의 형제(중앙). */}
        <div className="closing__names">
          <span className="closing__name serif">{babies[0].name}</span>
          <span className="closing__dot" aria-hidden="true">·</span>
          <span className="closing__name serif">{babies[1].name}</span>
        </div>

        {closing.family ? (
          <p className="closing__family">{closing.family}</p>
        ) : (
          <p className="slot-note caption">가족 이름 추후 안내</p>
        )}
      </Reveal>
    </footer>
  )
}
