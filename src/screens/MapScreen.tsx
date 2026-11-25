import { useEffect } from 'react'
import { BUDDIES, PLACES, type PlaceId } from '../data/content'
import { Buddy } from '../components/Characters'
import { FranceMap, MAP_PINS } from '../components/Scenes'
import { Bubble, TopBar } from '../components/ui'
import { isPlaceOpen, placeProgress, useStore, type Kid } from '../lib/store'
import { speak } from '../lib/speech'
import { sfx } from '../lib/sfx'
import { fit, useScreen } from '../lib/useScreen'

export function MapScreen({
  kid,
  onBack,
  onPlace,
  onAlbum,
  onBonus,
}: {
  kid: Kid
  onBack: () => void
  onPlace: (p: PlaceId) => void
  onAlbum: () => void
  onBonus: () => void
}) {
  const { family } = useStore()
  const buddy = BUDDIES[kid.buddy]
  const scr = useScreen()
  const line = `Coucou ${kid.name} ! Où est-ce qu’on va aujourd’hui ?`
  useEffect(() => {
    void speak(line, buddy.voice)
  }, [line, buddy.voice])

  return (
    <div className="screen map-screen">
      <TopBar onBack={onBack} stars={kid.stars} title="La carte de France" />
      <div className="map-layout">
        <div className="map-wrap">
          <FranceMap />
          {PLACES.map((p, i) => {
            const open = isPlaceOpen(kid, i, family.unlockAll)
            const prog = placeProgress(kid, p.id)
            const pin = MAP_PINS[p.id]
            return (
              <button
                key={p.id}
                className={`pin ${open ? '' : 'locked'} ${prog.complete ? 'complete' : ''}`}
                style={{ left: `${pin.x / 10}%`, top: `${pin.y / 10}%`, ['--c' as string]: p.color }}
                onClick={() => {
                  if (!open) {
                    sfx.oops()
                    void speak(`C’est encore fermé ! Joue d’abord à ${PLACES[i - 1].short}.`, buddy.voice)
                    return
                  }
                  sfx.tap()
                  onPlace(p.id)
                }}
              >
                <span className="pin-emoji">{open ? (prog.complete ? p.badge.emoji : '📍') : '🔒'}</span>
                <span className="pin-label">{p.short}</span>
                {open && (
                  <span className="pin-dots">
                    {Array.from({ length: prog.total }).map((_, j) => (
                      <i key={j} className={j < prog.done ? 'on' : ''} />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="map-side">
          <Buddy id={kid.buddy} size={scr.portrait ? fit(scr, 0.24, 80, 170) : 150} outfit={kid.outfit} />
          <Bubble who={buddy.name} text={line} />
          <button className="big-btn album" onClick={() => (sfx.tap(), onAlbum())}>
            📒 Mon album
          </button>
          <button className="big-btn bonus" onClick={() => (sfx.tap(), onBonus())}>
            🎮 Jeux bonus
          </button>
        </div>
      </div>
    </div>
  )
}
