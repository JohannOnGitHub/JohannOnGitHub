import { useEffect, useRef, useState } from 'react'
import { ALL_ACTIVITIES, BONUS_GAMES, BUDDIES, PLACES, WEARABLES, type BonusGame } from '../data/content'
import { Buddy, MonsterTruck, Pic } from '../components/Characters'
import { Scene } from '../components/Scenes'
import { Bubble, Confetti, TopBar } from '../components/ui'
import { addStars, badgesOf, updateKid, type Kid } from '../lib/store'
import { canListen, listen, speak } from '../lib/speech'
import { sfx } from '../lib/sfx'
import { BUDDY } from '../data/lines'
import { fit, useScreen } from '../lib/useScreen'

export function BonusMenu({ kid, onBack, onPlay }: { kid: Kid; onBack: () => void; onPlay: (g: BonusGame['id']) => void }) {
  useEffect(() => {
    const open = BONUS_GAMES.filter((g) => kid.stars >= g.stars).length
    void speak(
      open
        ? BUDDY.bonus
        : BUDDY.bonusClosed,
      BUDDIES[kid.buddy].voice,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="screen">
      <Scene place="provence" />
      <TopBar onBack={onBack} stars={kid.stars} title="Jeux bonus" />
      <div className="bonus-grid">
        {BONUS_GAMES.map((g) => {
          const open = kid.stars >= g.stars
          return (
            <button
              key={g.id}
              className={`bonus-card ${open ? '' : 'locked'}`}
              onClick={() => {
                if (!open) {
                  sfx.oops()
                  void speak(BUDDY.bonusLocked, BUDDIES[kid.buddy].voice)
                  return
                }
                sfx.tap()
                onPlay(g.id)
              }}
            >
              <span className="bonus-emoji">{open ? g.emoji : '🔒'}</span>
              <strong>{g.name}</strong>
              <small>{open ? g.desc : `Débloqué à ${g.stars} ⭐`}</small>
              {!open && (
                <div className="progress">
                  <i style={{ width: `${Math.min(100, (kid.stars / g.stars) * 100)}%` }} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------- Bubbles: pop soap bubbles holding the words you've learned ----------

type B = { id: number; x: number; emoji: string; word: string; dur: number; popped?: boolean }

export function Bulles({ kid, onBack }: { kid: Kid; onBack: () => void }) {
  const learned = ALL_ACTIVITIES.filter((a) => kid.done.includes(a.id))
  const pool = (learned.length ? learned : ALL_ACTIVITIES.slice(0, 4)).map((a) => ({ emoji: a.sticker.emoji, word: a.sticker.name }))
  const [bubbles, setBubbles] = useState<B[]>([])
  const [score, setScore] = useState(0)
  const nid = useRef(0)

  useEffect(() => {
    void speak(BUDDY.bulles, BUDDIES[kid.buddy].voice)
    const t = setInterval(() => {
      const w = pool[Math.floor(Math.random() * pool.length)]
      const b: B = { id: nid.current++, x: 5 + Math.random() * 80, dur: 6 + Math.random() * 4, ...w }
      setBubbles((bs) => [...bs.filter((x) => !x.popped).slice(-10), b])
    }, 1100)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (score > 0 && score % 10 === 0) {
      addStars(kid.id, 1)
      sfx.star()
    }
  }, [score, kid.id])

  return (
    <div className="screen bulles">
      <Scene place="marseille" />
      <TopBar onBack={onBack} stars={kid.stars} title={`🫧 ${score}`} />
      {bubbles.map((b) =>
        b.popped ? null : (
          <button
            key={b.id}
            className="soap"
            style={{ left: `${b.x}%`, animationDuration: `${b.dur}s` }}
            onPointerDown={() => {
              sfx.pop()
              setScore((s) => s + 1)
              setBubbles((bs) => bs.map((x) => (x.id === b.id ? { ...x, popped: true } : x)))
              void speak(b.word, BUDDIES[kid.buddy].voice)
            }}
          >
            <Pic v={b.emoji} />
          </button>
        ),
      )}
      <div className="bulles-hint">Toutes les 10 bulles : +1 ⭐</div>
    </div>
  )
}

// ---------- Atelier: dress up your buddy with treasures from each place ----------

export function Atelier({ kid, onBack }: { kid: Kid; onBack: () => void }) {
  const badges = badgesOf(kid)
  const buddy = BUDDIES[kid.buddy]
  const [line, setLine] = useState('Choisis un trésor et je le mets !')
  const scr = useScreen()
  useEffect(() => {
    void speak(BUDDY.atelier, buddy.voice)
  }, [buddy.voice])

  return (
    <div className="screen">
      <Scene place="stvincent" />
      <TopBar onBack={onBack} stars={kid.stars} title="🎨 L’atelier" />
      <div className="atelier">
        <div className="atelier-stage">
          <Buddy id={kid.buddy} size={scr.portrait ? fit(scr, 0.45, 160, 320) : 260} outfit={kid.outfit} />
          <Bubble who={buddy.name} text={line} voice={buddy.voice} />
        </div>
        <div className="wardrobe">
          {PLACES.map((p) => {
            const open = badges.includes(p.id)
            return (
              <div key={p.id} className="wardrobe-row">
                <span className="wardrobe-place">{open ? p.badge.emoji : '🔒'} {p.short}</span>
                {WEARABLES.filter((w) => w.place === p.id).map((w) => {
                  const on = kid.outfit[w.slot] === w.id
                  return (
                    <button
                      key={w.id}
                      className={`wear ${on ? 'on' : ''} ${open ? '' : 'locked'}`}
                      onClick={() => {
                        if (!open) {
                          sfx.oops()
                          const t = BUDDY.atelierLocked(p.short)
                          setLine(t)
                          void speak(t, buddy.voice)
                          return
                        }
                        sfx.pop()
                        updateKid(kid.id, (k) => ({ outfit: { ...k.outfit, [w.slot]: on ? undefined : w.id } }))
                        const t = on ? BUDDY.unwear(w.name) : BUDDY.wear(w.name, kid.buddy === 'givrine')
                        setLine(t)
                        void speak(t, buddy.voice)
                      }}
                    >
                      {open ? w.emoji : '❔'}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------- Les 21 virages: shout to drive the monster truck up Alpe d'Huez ----------

const BENDS = 21
const roadX = (i: number) => (i % 2 === 0 ? 25 : 75)
const ROAD = Array.from({ length: BENDS + 1 }, (_, i) => `${roadX(i)},${92 - (i / BENDS) * 80}`).join(' ')

export function Virages({ kid, onBack }: { kid: Kid; onBack: () => void }) {
  const [bend, setBend] = useState(0)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('Crie « Allez ! » ou « Vroum ! » pour avancer !')
  const won = bend >= BENDS
  const buddy = BUDDIES[kid.buddy]

  useEffect(() => {
    void speak(
      canListen
        ? BUDDY.virages
        : BUDDY.viragesNoMic,
      buddy.voice,
    )
  }, [buddy.voice])

  const advance = (n: number) => {
    if (bend >= BENDS) return
    const nb = Math.min(BENDS, bend + n)
    sfx.vroom()
    setBend(nb)
    if (nb >= BENDS) {
      sfx.win()
      addStars(kid.id, 3)
      void speak(BUDDY.viragesWin, buddy.voice)
    } else {
      const remaining = BENDS - nb
      void speak(remaining <= 10 ? BUDDY.viragesLeft(remaining) : BUDDY.vroum, buddy.voice)
    }
  }

  const shout = async () => {
    if (busy) return
    setBusy(true)
    setMsg('Je t’écoute… crie fort !')
    const SHOUT = /allez|allé|aller|vroum|vroom|broum|go|plus vite|en avant|vite/i
    const { heard } = await listen({ maxMs: 5000, silenceMs: 1000, isMatch: (h) => SHOUT.test(h.join(' ')) })
    setBusy(false)
    const t = heard.join(' ')
    if (SHOUT.test(t)) {
      setMsg('Super ! Encore !')
      advance(3)
    } else if (heard.length) {
      setMsg('Crie « Allez ! » encore plus fort !')
      advance(1)
    } else setMsg('Je n’ai rien entendu… Crie « Allez ! »')
  }

  // Truck position along a zig-zag road.
  const row = Math.min(bend, BENDS)
  const y = 92 - (row / BENDS) * 80
  const x = roadX(row)

  return (
    <div className="screen">
      <Scene place="alpe" />
      <TopBar onBack={onBack} stars={kid.stars} title={`🛻 Virage ${Math.min(bend, BENDS)} / ${BENDS}`} />
      <div className="virages">
        <div className="road-area">
        <svg className="road" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polyline
            points={ROAD}
            fill="none"
            stroke="#4a4e69"
            strokeWidth="22"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <polyline points={ROAD} fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" />
          {Array.from({ length: BENDS + 1 }, (_, i) => (
            <text key={i} x={roadX(i) + (i % 2 ? 4 : -4)} y={92 - (i / BENDS) * 80 + 1} fontSize="2.6" textAnchor="middle" fill="#fff" fontWeight="800" style={{ paintOrder: 'stroke', stroke: '#4a4e69', strokeWidth: 0.6 }}>
              {i > 0 && i <= bend ? '⭐' : ''}
            </text>
          ))}
        </svg>
        <div className="finish" style={{ left: '50%', top: '6%' }}>🏁</div>
        <div className="truck-pos" style={{ left: `${x}%`, top: `${y}%` }}>
          <MonsterTruck size={110} color={kid.buddy === 'givrine' ? '#c77dff' : '#e63946'} />
        </div>
        </div>
        {won && <Confetti />}
        <div className="virages-controls">
          <Bubble who={buddy.name} text={won ? 'On est en haut ! Champion !' : msg} voice={buddy.voice} />
          {won ? (
            <button className="big-btn go" onClick={() => setBend(0)}>
              🔁 Encore une course !
            </button>
          ) : (
            <div className="row-center">
              {canListen && (
                <button className={`mic ${busy ? 'listening' : 'ready'}`} onClick={() => void shout()}>
                  <span className="mic-icon">🎤</span>
                  <span>Allez !</span>
                </button>
              )}
              <button className="big-btn" onClick={() => advance(1)}>
                🛻 Vroum
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
