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

        {/* 지도(C12): iframe 임베드는 카카오 JS 키 필요 → 정적 호스팅에선
            외부 지도 링크(mapLinkUrl)로 처리. 둘 다 없으면 플레이스홀더. */}
        <div className="location__map">
          {location.mapEmbedUrl ? (
            <iframe
              title="지도"
              src={location.mapEmbedUrl}
              loading="lazy"
              style={{ border: 0, width: '100%', height: '100%' }}
            />
          ) : location.mapLinkUrl ? (
            <a
              className="location__map-link"
              href={location.mapLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <PinIcon width={28} height={28} />
              <span className="btn btn--accent btn--sm location__map-cta">
                카카오맵에서 보기
              </span>
            </a>
          ) : (
            <div className="location__map-ph">
              <PinIcon width={26} height={26} />
              <span className="slot-note">지도 준비 중</span>
            </div>
          )}
        </div>

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

        {/* 교통/주차(C13) */}
        {location.transit ? (
          <p className="location__transit caption">{location.transit}</p>
        ) : (
          <p className="slot-note caption">교통·주차 안내 추후 제공</p>
        )}
      </Reveal>
    </section>
  )
}
