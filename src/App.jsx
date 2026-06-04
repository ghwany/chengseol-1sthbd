import { useRef } from 'react'
import Hero from './components/Hero.jsx'
import Greeting from './components/Greeting.jsx'
import DatePlace from './components/DatePlace.jsx'
import Location from './components/Location.jsx'
import Closing from './components/Closing.jsx'
import HanokBackdrop from './components/HanokBackdrop.jsx'
import WaterShimmer from './components/WaterShimmer.jsx'
import { useMotionEnabled } from './hooks/useMotionEnabled.js'
import { usePointer } from './hooks/usePointer.js'
import { useScrollProgress } from './hooks/useScrollProgress.js'

export default function App() {
  const rootRef = useRef(null)
  const { pointerMotion, ambientMotion } = useMotionEnabled()

  // 변수는 .app-root 에 발행 → backdrop·Hero 가 상속(:root 회피)
  usePointer(rootRef, pointerMotion)
  useScrollProgress(rootRef)

  return (
    <div className="app-root" ref={rootRef}>
      <HanokBackdrop />
      {/* 여름 윤슬 — 전역 배경에 은은히 흐르는 빛 일렁임(caustics). reduced-motion이면 미렌더. (§5-1) */}
      {ambientMotion && <WaterShimmer enabled count={pointerMotion ? 16 : 10} />}
      <div className="invitation">
        <Hero />
        <Greeting />
        <DatePlace />
        <Location />
        <Closing />
      </div>
    </div>
  )
}
