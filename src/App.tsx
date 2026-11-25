import { useEffect, useState } from 'react'
import { ACHIEVEMENTS, type BonusGame, type PlaceId } from './data/content'
import { selectKid, useStore } from './lib/store'
import { initSync } from './lib/sync'
import { stopListening, stopSpeaking } from './lib/speech'
import { sfx } from './lib/sfx'
import { Home } from './screens/Home'
import { MapScreen } from './screens/MapScreen'
import { PlaceScreen } from './screens/PlaceScreen'
import { GameScreen } from './screens/GameScreen'
import { Album } from './screens/Album'
import { Atelier, BonusMenu, Bulles, Virages } from './screens/Bonus'
import { Parent } from './screens/Parent'

type Route =
  | { name: 'home' }
  | { name: 'parent' }
  | { name: 'map' }
  | { name: 'place'; place: PlaceId }
  | { name: 'game'; place: PlaceId; activity: string }
  | { name: 'album' }
  | { name: 'bonus' }
  | { name: 'bonusgame'; game: BonusGame['id'] }

export default function App() {
  const { kids, currentKid } = useStore()
  const kid = kids.find((k) => k.id === currentKid) ?? null
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [toasts, setToasts] = useState<string[]>([])

  useEffect(() => {
    void initSync()
  }, [])

  const go = (r: Route) => {
    stopSpeaking()
    stopListening()
    setRoute(r)
  }

  const celebrate = (ids: string[]) => {
    sfx.star()
    setToasts((t) => [...t, ...ids])
    setTimeout(() => setToasts((t) => t.slice(ids.length)), 4500)
  }

  const needsKid = route.name !== 'home' && route.name !== 'parent'
  if (needsKid && !kid) {
    return <Home onPlay={() => go({ name: 'map' })} onParent={() => go({ name: 'parent' })} />
  }

  let screen: React.ReactNode
  switch (route.name) {
    case 'home':
      screen = <Home onPlay={() => go({ name: 'map' })} onParent={() => go({ name: 'parent' })} />
      break
    case 'parent':
      screen = <Parent onBack={() => go({ name: 'home' })} />
      break
    case 'map':
      screen = (
        <MapScreen
          kid={kid!}
          onBack={() => {
            selectKid(null)
            go({ name: 'home' })
          }}
          onPlace={(p) => go({ name: 'place', place: p })}
          onAlbum={() => go({ name: 'album' })}
          onBonus={() => go({ name: 'bonus' })}
        />
      )
      break
    case 'place':
      screen = (
        <PlaceScreen
          kid={kid!}
          placeId={route.place}
          onBack={() => go({ name: 'map' })}
          onPlay={(a) => go({ name: 'game', place: route.place, activity: a })}
          onAchievements={celebrate}
        />
      )
      break
    case 'game':
      screen = (
        <GameScreen
          kid={kid!}
          placeId={route.place}
          activityId={route.activity}
          onBack={() => go({ name: 'place', place: route.place })}
          onNext={(a) => go(a ? { name: 'game', place: route.place, activity: a } : { name: 'map' })}
          onAchievements={celebrate}
        />
      )
      break
    case 'album':
      screen = <Album kid={kid!} onBack={() => go({ name: 'map' })} />
      break
    case 'bonus':
      screen = <BonusMenu kid={kid!} onBack={() => go({ name: 'map' })} onPlay={(g) => go({ name: 'bonusgame', game: g })} />
      break
    case 'bonusgame': {
      const back = () => go({ name: 'bonus' })
      screen =
        route.game === 'bulles' ? (
          <Bulles kid={kid!} onBack={back} />
        ) : route.game === 'atelier' ? (
          <Atelier kid={kid!} onBack={back} />
        ) : (
          <Virages kid={kid!} onBack={back} />
        )
      break
    }
  }

  return (
    <>
      {screen}
      <div className="toasts">
        {toasts.map((id, i) => {
          const a = ACHIEVEMENTS.find((x) => x.id === id)
          return a ? (
            <div key={`${id}-${i}`} className="toast">
              <span>{a.emoji}</span>
              <div>
                <strong>Trophée : {a.name}</strong>
                <small>{a.desc}</small>
              </div>
            </div>
          ) : null
        })}
      </div>
    </>
  )
}
