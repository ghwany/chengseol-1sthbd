import Reveal from './Reveal.jsx'
import Photo from './Photo.jsx'
import { DancheongGlyph, Jogakbo } from './motifs.jsx'
import { content } from '../content.js'

/**
 * Gallery — 쌍둥이 균형. 페어 2열 그리드(열 순서는 babies 배열 따름), 동수 유지. (스펙 §4-3 안 A)
 * 사진 미제공 시 양 열에 동일 개수의 플레이스홀더 박스를 렌더(균형 보존).
 * 그리드 내 stagger 80ms. (스펙 §5)
 */
export default function Gallery() {
  const { gallery, babies } = content

  // 두 열은 항상 동수. 실제 사진이 부족하면 placeholderPerBaby 로 채움.
  const count = Math.max(
    gallery.cheonga.length,
    gallery.seola.length,
    gallery.placeholderPerBaby,
  )

  // 사진은 아기별 데이터 키(청아/설아)로 짝지음 → babies 순서가 바뀌어도 라벨↔사진 불일치 없음.
  const photosByShort = { 청아: gallery.cheonga, 설아: gallery.seola }
  // 열 순서·좌우(거울 대칭)는 babies 배열 순서를 따름.
  const columns = babies.map((baby, i) => ({
    label: baby.short,
    photos: photosByShort[baby.short] ?? [],
    side: i === 0 ? 'left' : 'right',
  }))

  return (
    <section className="section">
      <Reveal className="gallery">
        <h2 className="section-title serif gallery__title">
          <span className="title-with-glyph">
            <DancheongGlyph size={22} />
            {gallery.title}
          </span>
        </h2>

        {/* 함께 사진(C7, 선택) — 있을 때만 풀폭 1열 */}
        {gallery.together.length > 0 && (
          <div className="gallery__together">
            {gallery.together.map((src, i) => (
              <div className="photo-mat" key={`tg-${i}`}>
                <Photo src={src} ratio="3 / 2" label="설아 · 청아" />
              </div>
            ))}
          </div>
        )}

        <div className="gallery__grid">
          {columns.map((col) => (
            <Jogakbo side={col.side} key={col.label}>
              <div className="gallery__col">
                <span className="gallery__col-label label">{col.label}</span>
                {Array.from({ length: count }).map((_, i) => (
                  <Reveal
                    key={`${col.label}-${i}`}
                    delay={i * 80}
                    className="gallery__cell"
                  >
                    <Photo src={col.photos[i] ?? null} ratio="4 / 5" label={col.label} />
                  </Reveal>
                ))}
              </div>
            </Jogakbo>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
