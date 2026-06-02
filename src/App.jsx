import Hero from './components/Hero.jsx'
import Greeting from './components/Greeting.jsx'
import Gallery from './components/Gallery.jsx'
import DatePlace from './components/DatePlace.jsx'
import Location from './components/Location.jsx'
import Closing from './components/Closing.jsx'

export default function App() {
  return (
    <div className="invitation">
      <Hero />
      <Greeting />
      <Gallery />
      <DatePlace />
      <Location />
      <Closing />
    </div>
  )
}
