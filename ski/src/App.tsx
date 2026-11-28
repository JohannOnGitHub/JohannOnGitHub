import { useEffect, useState } from 'react'
import { Toaster } from './components/ui'
import { useBackend } from './lib/store'
import Clothing from './screens/Clothing'
import Gear from './screens/Gear'
import Home from './screens/Home'
import Log from './screens/Log'
import Resorts from './screens/Resorts'
import Shop from './screens/Shop'
import Trips from './screens/Trips'

const TABS = [
  { id: 'home', label: 'Home', ico: '⌂' },
  { id: 'trips', label: 'Trips', ico: '✈' },
  { id: 'log', label: 'Log', ico: '✎' },
  { id: 'gear', label: 'Gear', ico: '⛷' },
  { id: 'clothing', label: 'Clothing', ico: '❄' },
  { id: 'resorts', label: 'Resorts', ico: '▲' },
  { id: 'shop', label: 'Shop', ico: '🛒' },
] as const

const readHash = () => location.hash.replace(/^#/, '') || 'home'

export default function App() {
  const [route, setRoute] = useState(readHash)
  useEffect(() => {
    const on = () => {
      setRoute(readHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = (h: string) => {
    location.hash = h
  }
  const backend = useBackend()
  const tripId = route.startsWith('trip-') ? route.slice(5) : null
  const section = tripId ? 'trips' : route

  return (
    <>
      <header className="top">
        <div className="top-in">
          <a className="brand" href="#home">
            <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M2 54 24 18l9 13 7-9 22 32z" fill="currentColor" opacity="0.9" /><path d="M24 18l-6 10 6-3 5 4z" fill="#9cc3e6" /></svg>
            Ski Base
          </a>
          <nav className="tabs" aria-label="Sections">
            {TABS.map((t) => (
              <a key={t.id} href={`#${t.id}`} aria-current={section === t.id ? 'page' : undefined}>
                <span className="ico" aria-hidden="true">{t.ico}</span>
                {t.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main>
        {backend.state === 'loading' && <div className="banner">Loading your ski data…</div>}
        {(backend.state === 'offline' || backend.state === 'error') && <div className="banner error">{backend.message}</div>}
        {section === 'trips' ? <Trips tripId={tripId} go={go} />
          : section === 'log' ? <Log />
          : section === 'gear' ? <Gear />
          : section === 'clothing' ? <Clothing />
          : section === 'resorts' ? <Resorts go={go} />
          : section === 'shop' ? <Shop />
          : <Home go={go} />}
      </main>
      <Toaster />
    </>
  )
}
