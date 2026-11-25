import { useEffect, useState } from 'react'
import { ACHIEVEMENTS, BUDDIES, PLACES } from '../data/content'
import { TopBar } from '../components/ui'
import { Pic } from '../components/Characters'
import { placeProgress, type Kid } from '../lib/store'
import { speak } from '../lib/speech'
import { sfx } from '../lib/sfx'

export function Album({ kid, onBack }: { kid: Kid; onBack: () => void }) {
  const [tab, setTab] = useState<'stickers' | 'trophies'>('stickers')
  const voice = BUDDIES[kid.buddy].voice
  useEffect(() => {
    void speak(
      tab === 'stickers'
        ? kid.done.length
          ? `Voici ton album, ${kid.name} ! Tu as ${kid.done.length} autocollants. Touche un autocollant pour l’écouter !`
          : 'Voici ton album ! Il est encore vide. Joue sur la carte pour gagner des autocollants !'
        : 'Voici tes trophées ! Les trophées en couleur, tu les as gagnés !',
      voice,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])
  const total = PLACES.reduce((n, p) => n + p.activities.length, 0)
  return (
    <div className="screen album-screen">
      <TopBar onBack={onBack} stars={kid.stars} title={`L’album de ${kid.name}`} />
      <div className="tabs">
        <button className={tab === 'stickers' ? 'on' : ''} onClick={() => setTab('stickers')}>
          🌟 Autocollants {kid.done.length}/{total}
        </button>
        <button className={tab === 'trophies' ? 'on' : ''} onClick={() => setTab('trophies')}>
          🏆 Trophées {kid.achievements.length + PLACES.filter((p) => placeProgress(kid, p.id).complete).length}
        </button>
      </div>
      <div className="album-body">
        {tab === 'stickers' ? (
          PLACES.map((p) => (
            <section key={p.id} className="album-page" style={{ ['--c' as string]: p.color }}>
              <h3>{p.name}</h3>
              <div className="sticker-grid">
                {p.activities.map((a) => {
                  const got = kid.done.includes(a.id)
                  return (
                    <button
                      key={a.id}
                      className={`sticker ${got ? 'got' : ''}`}
                      onClick={() => {
                        if (!got) return
                        sfx.pop()
                        void speak(a.sticker.name)
                      }}
                    >
                      <span>{got ? <Pic v={a.sticker.emoji} /> : '❔'}</span>
                      <small>{got ? a.sticker.name : '???'}</small>
                    </button>
                  )
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="trophy-grid">
            {PLACES.map((p) => {
              const got = placeProgress(kid, p.id).complete
              return (
                <div key={p.id} className={`trophy ${got ? 'got' : ''}`}>
                  <span>{got ? p.badge.emoji : '🔒'}</span>
                  <strong>{p.badge.name}</strong>
                  <small>Finir {p.short}</small>
                </div>
              )
            })}
            {ACHIEVEMENTS.map((a) => {
              const got = kid.achievements.includes(a.id)
              return (
                <div key={a.id} className={`trophy ${got ? 'got' : ''}`}>
                  <span>{got ? a.emoji : '🔒'}</span>
                  <strong>{a.name}</strong>
                  <small>{a.desc}</small>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
