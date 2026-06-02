/**
 * 화면 고정 배경 인터랙션 레이어. CSS 변수(--pointer-x/y, --scroll-progress)만 읽는
 * 순수 표현 컴포넌트(자체 상태/이벤트 없음). 변수 발행은 App 의 훅이 담당.
 * - 빛 변화(C): morning/noon/dusk 3겹 opacity 크로스페이드
 * - 처마 패럴랙스(B): far/near 2겹 transform
 * - 빛망울(A): bloom 1겹 transform 이동
 */
export default function HanokBackdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__light backdrop__light--morning" />
      <div className="backdrop__light backdrop__light--dusk" />
      <div className="backdrop__light backdrop__light--noon" />
      <div className="backdrop__eaves backdrop__eaves--far" />
      <div className="backdrop__eaves backdrop__eaves--near" />
      <div className="backdrop__bloom" />
    </div>
  )
}
