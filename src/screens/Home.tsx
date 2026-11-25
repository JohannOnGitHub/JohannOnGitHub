import { useEffect, useState } from 'react'
import { BUDDIES, type BuddyId } from '../data/content'
import { Buddy, Pepette } from '../components/Characters'
import { Scene } from '../components/Scenes'
import { Bubble, HoldButton, MusicButton } from '../components/ui'
import { addKid, selectKid, setFamily, useStore } from '../lib/store'
import { speak } from '../lib/speech'
import { sfx } from '../lib/sfx'
import { fit, useScreen } from '../lib/useScreen'

export function Home({ onPlay, onParent }: { onPlay: () => void; onParent: () => void }) {
  const { kids } = useStore()
  const [adding, setAdding] = useState(kids.length === 0)
  const scr = useScreen()
  const cardSize = scr.portrait ? fit(scr, 0.26, 90, 170) : 120

  useEffect(() => {
    if (!adding) void speak('Coucou ! Qui vient jouer aujourd’hui ?', { pitch: 1.45, rate: 0.95 })
  }, [adding])

  if (adding) return <Setup onDone={() => setAdding(false)} first={kids.length === 0} onCancel={() => setAdding(false)} />

  return (
    <div className="screen">
      <Scene place="alpe" />
      <div className="home">
        <h1 className="title">
          Les Aventures
          <br />
          de Pépette
        </h1>
        <div className="home-guide">
          <button onClick={() => void speak('Coucou ! Qui vient jouer aujourd’hui ?', { pitch: 1.45, rate: 0.95 })} aria-label="Pépette">
            <Pepette size={scr.portrait ? fit(scr, 0.22, 90, 170) : 130} />
          </button>
          <Bubble text="Coucou ! Qui vient jouer aujourd’hui ?" />
        </div>
        <div className="kid-cards">
          {kids.map((k) => (
            <button
              key={k.id}
              className="kid-card"
              onClick={() => {
                sfx.tap()
                selectKid(k.id)
                onPlay()
              }}
            >
              <Buddy id={k.buddy} size={cardSize} outfit={k.outfit} />
              <div className="kid-name">{k.name}</div>
              <div className="kid-stars">⭐ {k.stars}</div>
            </button>
          ))}
          <button className="kid-card add" onClick={() => setAdding(true)}>
            <div className="plus">＋</div>
            <div className="kid-name">Ajouter</div>
          </button>
        </div>
      </div>
      <MusicButton className="music-corner" />
      <HoldButton className="parent-gear" onDone={onParent}>
        ⚙️ <small>Parents (rester appuyé)</small>
      </HoldButton>
    </div>
  )
}

function Setup({ onDone, onCancel, first }: { onDone: () => void; onCancel: () => void; first: boolean }) {
  const { family } = useStore()
  const [name, setName] = useState('')
  const [age, setAge] = useState(4)
  const [buddy, setBuddy] = useState<BuddyId>('rocco')
  const [parent, setParent] = useState(family.parent)
  const [mamie, setMamie] = useState(family.mamie)
  const [papi, setPapi] = useState(family.papi)

  return (
    <div className="screen">
      <Scene place="alpe" />
      <div className="panel setup">
        <h2>{first ? 'Bienvenue ! 👋' : 'Un nouvel aventurier !'}</h2>
        <p className="muted">
          {first
            ? 'Pour les parents : créez un profil pour chaque enfant. Les prénoms restent sur cet appareil.'
            : 'Créez le profil de l’enfant.'}
        </p>
        <label>
          Prénom de l’enfant
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Prénom" autoFocus />
        </label>
        <div className="label">Âge</div>
        <div className="chips">
          {[2, 3, 4, 5, 6, 7, 8].map((a) => (
            <button key={a} className={`chip ${a === age ? 'on' : ''}`} onClick={() => setAge(a)}>
              {a} ans
            </button>
          ))}
        </div>
        <div className="label">Son ami d’aventure</div>
        <div className="buddy-pick">
          {(Object.keys(BUDDIES) as BuddyId[]).map((b) => (
            <button
              key={b}
              className={`buddy-option ${b === buddy ? 'on' : ''}`}
              onClick={() => {
                setBuddy(b)
                void speak(`Je suis ${BUDDIES[b].name}, ${BUDDIES[b].title} !`, BUDDIES[b].voice)
              }}
            >
              <Buddy id={b} size={110} />
              <strong>
                {BUDDIES[b].name}, {BUDDIES[b].title}
              </strong>
              <span>{BUDDIES[b].blurb}</span>
            </button>
          ))}
        </div>
        {first && (
          <details className="family-words" open>
            <summary>Mots de la famille (utilisés dans les jeux)</summary>
            <div className="row3">
              <label>
                Les enfants vous appellent…
                <select value={parent} onChange={(e) => setParent(e.target.value)}>
                  <option>Papa</option>
                  <option>Maman</option>
                </select>
              </label>
              <label>
                Grand-parent de Marseille
                <input value={mamie} onChange={(e) => setMamie(e.target.value)} />
              </label>
              <label>
                Grand-parent de Rennes
                <input value={papi} onChange={(e) => setPapi(e.target.value)} />
              </label>
            </div>
          </details>
        )}
        <div className="row-end">
          {!first && (
            <button className="btn ghost" onClick={onCancel}>
              Annuler
            </button>
          )}
          <button
            className="btn primary"
            disabled={!name.trim()}
            onClick={() => {
              if (first) setFamily({ parent, mamie: mamie.trim() || 'Chacha', papi: papi.trim() || 'Papy' })
              addKid(name.trim(), age, buddy)
              selectKid(null)
              sfx.win()
              onDone()
            }}
          >
            C’est parti ! 🚀
          </button>
        </div>
      </div>
    </div>
  )
}
