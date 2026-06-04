import { useRef } from 'react'
import Hero from './components/Hero.jsx'
import Greeting from './components/Greeting.jsx'
import Gallery from './components/Gallery.jsx'
import DatePlace from './components/DatePlace.jsx'
import Location from './components/Location.jsx'
import Closing from './components/Closing.jsx'
import HanokBackdrop from './components/HanokBackdrop.jsx'
import { useMotionEnabled } from './hooks/useMotionEnabled.js'
import { usePointer } from './hooks/usePointer.js'
import { useScrollProgress } from './hooks/useScrollProgress.js'

export default function App() {
  const rootRef = useRef(null)
  const { pointerMotion } = useMotionEnabled()

  // 변수는 .app-root 에 발행 → backdrop·Hero 가 상속(:root 회피)
  usePointer(rootRef, pointerMotion)
  useScrollProgress(rootRef)

  return (
    <div className="app-root" ref={rootRef}>
      <HanokBackdrop />
      {/* 여름 윤슬은 전역 빛 입자가 아니라 Hero 내부 "수면 띠"로 이동(§5-1 재설계). */}
      <div className="invitation">
        <Hero />
        <Greeting />
        <Gallery />
        <DatePlace />
        <Location />
        <Closing />
      </div>
    </div>
  )
}
