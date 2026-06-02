import Reveal from './Reveal.jsx'
import { ClockIcon, CalendarIcon } from './icons.jsx'
import { RevealDivider } from './motifs.jsx'
import { content } from '../content.js'

/** Date & Place — 일시·장소. surface-white 카드. (스펙 §4-4) */
export default function DatePlace() {
  const { date, place, babies } = content

  // 캘린더 추가: 정적 호스팅 친화 Google Calendar 렌더 링크(SDK 불필요).
  // 시간 확정(11:30 KST). 행사 11:30–13:30 KST = 02:30–04:30 UTC.
  const calTitle = `${babies[0].short}·${babies[1].short} 첫 생일`
  const calUrl = date.time
    ? 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      `&text=${encodeURIComponent(calTitle)}` +
      '&dates=20260620T023000Z/20260620T043000Z' +
      `&location=${encodeURIComponent(place.name)}`
    : null

  return (
    <section className="section">
      <Reveal className="card card--white dateplace">
        <p className="dateplace__date serif">
          <span className="dateplace__num">{date.year}. {date.monthDay}</span>
        </p>
        <p className="dateplace__weekday serif">{date.weekday}</p>

        {/* 꽃살문 띠 구분선(스펙 §5 Date·Place) — accent draw-on */}
        <RevealDivider className="motif-divider--accent dateplace__divider" />

        {/* C9: 시간 미정 → 임의 표기 금지, 안내 슬롯 */}
        <p className="dateplace__time">
          <ClockIcon width={18} height={18} />
          {date.time ? (
            <span>{date.time}</span>
          ) : (
            <span className="slot-note">시간 추후 안내</span>
          )}
        </p>

        <p className="dateplace__place serif">{place.name}</p>
        {place.hall ? (
          <p className="dateplace__hall">{place.hall}</p>
        ) : (
          <p className="slot-note">홀/층 정보 추후 안내</p>
        )}

        {/* 캘린더 추가: 시간 확정 후에만 노출. 정적 호스팅이라 SDK 대신
            Google Calendar 렌더 링크(새 탭). (스펙 §4-4) */}
        {calUrl && (
          <a
            href={calUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--accent dateplace__cal"
          >
            <CalendarIcon width={18} height={18} />
            캘린더에 추가
          </a>
        )}
      </Reveal>
    </section>
  )
}
