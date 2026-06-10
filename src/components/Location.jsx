import { useState } from 'react'
import Reveal from './Reveal.jsx'
import { PinIcon, CopyIcon } from './icons.jsx'
import { RevealDivider } from './motifs.jsx'
import { content } from '../content.js'

/** Location — 오시는 길. 지도/주소/교통 모두 미제공이면 슬롯 표기. (스펙 §4-5) */
export default function Location() {
  const { location, place } = content
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!location.address) return
    try {
      await navigator.clipboard.writeText(location.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="section">
      <Reveal className="location">
        <h2 className="section-title serif location__title">{location.title}</h2>

        {/* 꽃살문 띠 구분선(스펙 §5 Location) */}
        <RevealDivider className="location__divider" />

        {/* 지도(C12): 구글맵 embed(API 키 불필요). 카카오맵 길찾기 링크는 아래 버튼으로 병행. */}
        <div className="location__map">
          {location.mapEmbedUrl ? (
            <iframe
              title="지도"
              src={location.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ border: 0, width: '100%', height: '100%' }}
            />
          ) : (
            <div className="location__map-ph">
              <PinIcon width={26} height={26} />
              <span className="slot-note">지도 준비 중</span>
            </div>
          )}
        </div>

        {/* 카카오맵 길찾기(키 불필요 외부 링크) */}
        {location.mapLinkUrl && (
          <a
            className="location__map-link"
            href={location.mapLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="btn btn--accent btn--sm location__map-cta">
              <PinIcon width={16} height={16} />
              카카오맵 길찾기
            </span>
          </a>
        )}

        <p className="location__placename serif">{place.name}</p>

        {/* 주소(C11) */}
        {location.address ? (
          <div className="location__addr-row">
            <p className="location__addr">{location.address}</p>
            <button
              type="button"
              className="btn btn--accent btn--sm"
              onClick={handleCopy}
            >
              <CopyIcon width={16} height={16} />
              {copied ? '복사됨' : '주소 복사'}
            </button>
          </div>
        ) : (
          <p className="slot-note">주소 추후 안내</p>
        )}

        {/* 교통/주차(C13) — 미제공 시 노출 안 함 */}
        {location.transit && (
          <p className="location__transit caption">{location.transit}</p>
        )}
      </Reveal>
    </section>
  )
}
