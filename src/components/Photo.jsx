import { ImageIcon } from './icons.jsx'

const BASE = import.meta.env.BASE_URL // GitHub Pages base 경로 자동 반영 (에셋 404 방지)

/**
 * 사진 슬롯. src 가 있으면 이미지, 없으면 한지 톤 플레이스홀더 박스.
 * 고정 종횡비(기본 4:5)로 레이아웃 시프트(CLS) 방지. (스펙 §4-3)
 *
 * @param {string|null} src   - 'images/foo.webp' 형태(BASE_URL 자동 prefix). 없으면 플레이스홀더.
 * @param {string} ratio      - aspect-ratio (예 '4 / 5', '3 / 4')
 * @param {string} label      - 플레이스홀더/접근성 라벨 (예 '청아')
 * @param {boolean} eager     - true 면 즉시 로드(Hero 대표 사진), 아니면 lazy.
 */
export default function Photo({ src, ratio = '4 / 5', label = '', eager = false }) {
  if (!src) {
    return (
      <div className="photo photo--placeholder" style={{ aspectRatio: ratio }}>
        <ImageIcon width={28} height={28} />
        <span className="photo__ph-label">
          {label ? `${label} 사진` : '사진'} 준비 중
        </span>
      </div>
    )
  }
  return (
    <div className="photo" style={{ aspectRatio: ratio }}>
      <img
        src={`${BASE}${src}`}
        alt={label || '사진'}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  )
}
