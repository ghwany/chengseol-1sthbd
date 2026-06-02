/**
 * 값을 [min, max] 범위로 제한.
 * @param min - max 이하라고 가정 (min > max 인 경우 동작 미정의)
 */
export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

/**
 * 선형 보간: t=0 → a, t=1 → b.
 * t는 보통 0..1 범위이며, 범위 밖이면 외삽(extrapolation)된다.
 */
export function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * 요소(rect) 기준으로 포인터를 -1..1 로 정규화. 중심=0, 우/하=+1, 좌/상=-1.
 * 폭·높이가 0 이면 0 division 을 피해 0 반환.
 */
export function normalizePointer(clientX, clientY, rect) {
  const halfW = rect.width / 2
  const halfH = rect.height / 2
  const x = halfW === 0 ? 0 : clamp((clientX - (rect.left + halfW)) / halfW, -1, 1)
  const y = halfH === 0 ? 0 : clamp((clientY - (rect.top + halfH)) / halfH, -1, 1)
  return { x, y }
}

/** 페이지 세로 스크롤 진행도 0..1. 스크롤 불가 시 0. */
export function scrollProgress(scrollY, scrollHeight, viewportHeight) {
  const max = scrollHeight - viewportHeight
  if (max <= 0) return 0
  return clamp(scrollY / max, 0, 1)
}
